/**
 * Validação de Fluxo por Perfil de Usuário
 *
 * Cobre os três perfis principais da plataforma:
 *   • Administrador (admin)        — gerencia usuários, cria conteúdo, vê auditoria
 *   • Personal     (practitioner)  — cria templates/sessões/pacientes, não gerencia usuários
 *   • Aluno        (viewer)        — leitura total, nenhuma escrita
 *
 * Cada describe-block representa o percurso completo de um perfil:
 *   happy-path (o que pode fazer) + restrições (o que deve receber 403).
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

// ── Dados compartilhados entre perfis ─────────────────────────────────────────

let app: FastifyInstance;
let tenantId: string;

// Tokens por perfil
let ownerToken: string;
let adminToken: string;
let practitionerToken: string;
let viewerToken: string;

// IDs de recursos criados pelo owner para leitura pelos demais perfis
let sharedTemplateId: string;
let sharedPatientId: string;
let sharedSessionId: string;

// ── Setup global ──────────────────────────────────────────────────────────────

beforeAll(async () => {
  app = await createTestApp();

  const ownerLogin = await loginAsOwner(app);
  ownerToken = ownerLogin.token;
  tenantId = ownerLogin.tenantId;

  // Upgrade para 'solo' para habilitar insights de AI
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (app as any).prisma.tenant.update({
    where: { id: tenantId },
    data: { planTier: 'solo' },
  });

  // ── Criar usuários de teste ───────────────────────────────────────────────

  const ts = Date.now();

  // Admin
  const adminEmail = `admin-flow-${ts}@test.com`;
  await app.inject({
    method: 'POST',
    url: '/v1/users',
    headers: authHeaders(ownerToken, tenantId),
    payload: { email: adminEmail, password: STRONG_PASSWORD, role: 'admin' },
  });
  const adminLogin = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { email: adminEmail, password: STRONG_PASSWORD },
  });
  adminToken = adminLogin.json().token;

  // Practitioner
  const practEmail = `practitioner-flow-${ts}@test.com`;
  await app.inject({
    method: 'POST',
    url: '/v1/users',
    headers: authHeaders(ownerToken, tenantId),
    payload: { email: practEmail, password: STRONG_PASSWORD, role: 'practitioner' },
  });
  const practLogin = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { email: practEmail, password: STRONG_PASSWORD },
  });
  practitionerToken = practLogin.json().token;

  // Viewer
  const viewerEmail = `viewer-flow-${ts}@test.com`;
  await app.inject({
    method: 'POST',
    url: '/v1/users',
    headers: authHeaders(ownerToken, tenantId),
    payload: { email: viewerEmail, password: STRONG_PASSWORD, role: 'viewer' },
  });
  const viewerLogin = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { email: viewerEmail, password: STRONG_PASSWORD },
  });
  viewerToken = viewerLogin.json().token;

  // ── Recursos compartilhados (criados pelo owner) ──────────────────────────

  const tplRes = await app.inject({
    method: 'POST',
    url: '/v1/anamnesis/templates',
    headers: authHeaders(ownerToken, tenantId),
    payload: {
      name: `Template Compartilhado ${ts}`,
      schemaJson: {
        questions: [
          { id: 'q1', text: 'Qualidade do sono (1-10)', type: 'number', required: true, tags: ['sleep'] },
          { id: 'q2', text: 'Nível de estresse', type: 'single', options: ['Baixo', 'Médio', 'Alto'], required: true, tags: ['stress'] },
          { id: 'q3', text: 'Pratica exercícios?', type: 'single', options: ['Nunca', 'Às vezes', 'Sempre'], required: false, tags: ['exercise'] },
        ],
      },
    },
  });
  sharedTemplateId = tplRes.json().id;

  const patientRes = await app.inject({
    method: 'POST',
    url: '/v1/patients',
    headers: authHeaders(ownerToken, tenantId),
    payload: {
      fullName: `Paciente Compartilhado ${ts}`,
      email: `paciente-shared-${ts}@test.com`,
    },
  });
  sharedPatientId = patientRes.json().id;

  const sessionRes = await app.inject({
    method: 'POST',
    url: '/v1/anamnesis/sessions',
    headers: authHeaders(ownerToken, tenantId),
    payload: { templateId: sharedTemplateId, patientId: sharedPatientId },
  });
  sharedSessionId = sessionRes.json().id;

  // Submete respostas para deixar sessão com dados
  await app.inject({
    method: 'POST',
    url: `/v1/anamnesis/sessions/${sharedSessionId}/answers`,
    headers: authHeaders(ownerToken, tenantId),
    payload: { answersJson: { q1: 7, q2: 'Médio', q3: 'Às vezes' } },
  });
}, 30000);

afterAll(async () => {
  await app.close();
});

// ══════════════════════════════════════════════════════════════════════════════
// PERFIL 1: ADMINISTRADOR
// ══════════════════════════════════════════════════════════════════════════════

describe('Perfil: Administrador (admin)', () => {
  const ts = () => Date.now();

  // ── Autenticação ────────────────────────────────────────────────────────────

  it('login retorna token válido', () => {
    expect(typeof adminToken).toBe('string');
    expect(adminToken.length).toBeGreaterThan(0);
  });

  // ── Gestão de usuários ──────────────────────────────────────────────────────

  it('pode criar um usuário com role practitioner → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(adminToken, tenantId),
      payload: {
        email: `admin-created-pract-${ts()}@test.com`,
        password: STRONG_PASSWORD,
        role: 'practitioner',
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().role).toBe('practitioner');
  });

  it('pode listar usuários do tenant → 200 com array paginado', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/users',
      headers: authHeaders(adminToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
  });

  it('pode desativar um usuário → 200', async () => {
    // Cria usuário para desativar
    const createRes = await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(adminToken, tenantId),
      payload: {
        email: `to-deactivate-${ts()}@test.com`,
        password: STRONG_PASSWORD,
        role: 'viewer',
      },
    });
    const userId = createRes.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/users/${userId}/deactivate`,
      headers: authHeaders(adminToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
  });

  // ── Templates ───────────────────────────────────────────────────────────────

  it('pode criar template → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(adminToken, tenantId),
      payload: {
        name: `Template do Admin ${ts()}`,
        schemaJson: {
          questions: [
            { id: 'q1', text: 'Pergunta admin', type: 'text', required: true },
          ],
        },
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBeDefined();
  });

  it('pode listar templates → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(adminToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  // ── Pacientes ───────────────────────────────────────────────────────────────

  it('pode criar paciente → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(adminToken, tenantId),
      payload: {
        fullName: `Paciente do Admin ${ts()}`,
        email: `paciente-admin-${ts()}@test.com`,
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBeDefined();
  });

  it('pode listar pacientes → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: authHeaders(adminToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('pode atualizar dados de paciente → 200', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(adminToken, tenantId),
      payload: { fullName: `Atualizar Admin ${ts()}` },
    });
    const patientId = createRes.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/patients/${patientId}`,
      headers: authHeaders(adminToken, tenantId),
      payload: { fullName: 'Nome Atualizado pelo Admin' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().fullName).toBe('Nome Atualizado pelo Admin');
  });

  // ── Sessões & Insights ──────────────────────────────────────────────────────

  it('pode criar sessão → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(adminToken, tenantId),
      payload: { templateId: sharedTemplateId },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBeDefined();
  });

  it('pode submeter respostas em uma sessão → 200', async () => {
    const sRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(adminToken, tenantId),
      payload: { templateId: sharedTemplateId },
    });
    const sId = sRes.json().id;

    const res = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${sId}/answers`,
      headers: authHeaders(adminToken, tenantId),
      payload: { answersJson: { q1: 8, q2: 'Alto', q3: 'Nunca' } },
    });
    expect(res.statusCode).toBe(200);
  });

  it('pode gerar insights de AI para sessão com respostas → 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/ai/insights',
      headers: authHeaders(adminToken, tenantId),
      payload: { sessionId: sharedSessionId },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.summary).toBeDefined();
    expect(body.risksJson).toBeDefined();
    expect(body.recommendationsJson).toBeDefined();
  });

  // ── Auditoria ───────────────────────────────────────────────────────────────

  it('pode visualizar logs de auditoria → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/audit',
      headers: authHeaders(adminToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  // ── Restrições (403) ────────────────────────────────────────────────────────

  it('NÃO pode criar tenant → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tenants',
      headers: authHeaders(adminToken, tenantId),
      payload: { name: 'Tenant do Admin' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode suspender tenant → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/tenants/${tenantId}/suspend`,
      headers: authHeaders(adminToken, tenantId),
    });
    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PERFIL 2: PERSONAL (PRACTITIONER)
// ══════════════════════════════════════════════════════════════════════════════

describe('Perfil: Personal (practitioner)', () => {
  const ts = () => Date.now();

  // ── Autenticação ────────────────────────────────────────────────────────────

  it('login retorna token válido', () => {
    expect(typeof practitionerToken).toBe('string');
    expect(practitionerToken.length).toBeGreaterThan(0);
  });

  // ── Templates ───────────────────────────────────────────────────────────────

  it('pode criar template → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(practitionerToken, tenantId),
      payload: {
        name: `Template do Personal ${ts()}`,
        schemaJson: {
          questions: [
            { id: 'q1', text: 'Objetivo principal', type: 'text', required: true },
            { id: 'q2', text: 'Nível de atividade física', type: 'single', options: ['Sedentário', 'Moderado', 'Ativo'], required: true, tags: ['exercise'] },
          ],
        },
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBeDefined();
  });

  it('pode atualizar template → 200', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(practitionerToken, tenantId),
      payload: {
        name: `Template a Editar ${ts()}`,
        schemaJson: { questions: [{ id: 'q1', text: 'Q', type: 'text', required: true }] },
      },
    });
    const tplId = createRes.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/anamnesis/templates/${tplId}`,
      headers: authHeaders(practitionerToken, tenantId),
      payload: { name: 'Template Editado pelo Personal' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('Template Editado pelo Personal');
  });

  it('pode listar templates → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('pode visualizar template específico → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/anamnesis/templates/${sharedTemplateId}`,
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(sharedTemplateId);
  });

  // ── Pacientes ───────────────────────────────────────────────────────────────

  it('pode criar paciente → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(practitionerToken, tenantId),
      payload: {
        fullName: `Paciente do Personal ${ts()}`,
        email: `paciente-personal-${ts()}@test.com`,
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBeDefined();
  });

  it('pode atualizar paciente → 200', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(practitionerToken, tenantId),
      payload: { fullName: `Paciente para editar ${ts()}` },
    });
    const patientId = createRes.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/patients/${patientId}`,
      headers: authHeaders(practitionerToken, tenantId),
      payload: { fullName: 'Paciente Atualizado pelo Personal' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('pode ver timeline do paciente → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/patients/${sharedPatientId}/timeline`,
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
  });

  it('pode exportar lista de pacientes em CSV → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients/export/csv',
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/csv/i);
  });

  // ── Sessões ──────────────────────────────────────────────────────────────────

  it('pode criar sessão para paciente → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(practitionerToken, tenantId),
      payload: { templateId: sharedTemplateId, patientId: sharedPatientId },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBeDefined();
  });

  it('pode submeter respostas em sessão → 200', async () => {
    const sRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(practitionerToken, tenantId),
      payload: { templateId: sharedTemplateId },
    });
    const sId = sRes.json().id;

    const res = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${sId}/answers`,
      headers: authHeaders(practitionerToken, tenantId),
      payload: { answersJson: { q1: 6, q2: 'Baixo', q3: 'Sempre' } },
    });
    expect(res.statusCode).toBe(200);
  });

  it('pode assinar sessão → 200', async () => {
    const sRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(practitionerToken, tenantId),
      payload: { templateId: sharedTemplateId },
    });
    const sId = sRes.json().id;

    const res = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${sId}/sign`,
      headers: authHeaders(practitionerToken, tenantId),
      payload: { signerName: 'Personal Trainer', agreed: true },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().signatureName).toBe('Personal Trainer');
  });

  it('pode gerar link público de preenchimento → 200', async () => {
    const sRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(practitionerToken, tenantId),
      payload: { templateId: sharedTemplateId },
    });
    const sId = sRes.json().id;

    const res = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${sId}/fill-link`,
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(typeof res.json().fillToken).toBe('string');
    expect(res.json().fillUrl).toBeDefined();
  });

  it('pode gerar insights de AI → 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/ai/insights',
      headers: authHeaders(practitionerToken, tenantId),
      payload: { sessionId: sharedSessionId },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.risksJson).toBeDefined();
    expect(Array.isArray(body.recommendationsJson)).toBe(true);
  });

  it('pode listar sessões → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  // ── Restrições (403) ────────────────────────────────────────────────────────

  it('NÃO pode criar usuário → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(practitionerToken, tenantId),
      payload: { email: `novo-${Date.now()}@test.com`, password: STRONG_PASSWORD, role: 'viewer' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode criar tenant → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tenants',
      headers: authHeaders(practitionerToken, tenantId),
      payload: { name: 'Tenant do Personal' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode visualizar logs de auditoria → 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/audit',
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PERFIL 3: ALUNO (VIEWER)
// ══════════════════════════════════════════════════════════════════════════════

describe('Perfil: Aluno (viewer)', () => {

  // ── Autenticação ────────────────────────────────────────────────────────────

  it('login retorna token válido', () => {
    expect(typeof viewerToken).toBe('string');
    expect(viewerToken.length).toBeGreaterThan(0);
  });

  // ── Leitura permitida ───────────────────────────────────────────────────────

  it('pode listar templates → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('pode visualizar template específico → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/anamnesis/templates/${sharedTemplateId}`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(sharedTemplateId);
  });

  it('pode listar sessões → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('pode visualizar sessão específica → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/anamnesis/sessions/${sharedSessionId}`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(sharedSessionId);
  });

  it('pode listar pacientes → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('pode visualizar paciente específico → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/patients/${sharedPatientId}`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(sharedPatientId);
  });

  it('pode visualizar timeline do paciente → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/patients/${sharedPatientId}/timeline`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
  });

  it('pode exportar lista de pacientes em CSV → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients/export/csv',
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(res.headers['content-type']).toMatch(/csv/i);
  });

  it('pode exportar sessão como JSON → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/anamnesis/sessions/${sharedSessionId}/export`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
  });

  it('pode visualizar insights já gerados → 200', async () => {
    // Garante que o insight existe (gerado pelos testes anteriores do admin/practitioner)
    const res = await app.inject({
      method: 'GET',
      url: `/v1/ai/insights/${sharedSessionId}`,
      headers: authHeaders(viewerToken, tenantId),
    });
    // 200 se já gerado, 404 se ainda não — ambos são válidos para a leitura do viewer
    expect([200, 404]).toContain(res.statusCode);
  });

  // ── Escrita bloqueada (403) ──────────────────────────────────────────────────

  it('NÃO pode criar template → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(viewerToken, tenantId),
      payload: {
        name: 'Template do Aluno',
        schemaJson: { questions: [{ id: 'q1', text: 'Q', type: 'text', required: true }] },
      },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode deletar template → 403', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/v1/anamnesis/templates/${sharedTemplateId}`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode criar sessão → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(viewerToken, tenantId),
      payload: { templateId: sharedTemplateId },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode submeter respostas → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${sharedSessionId}/answers`,
      headers: authHeaders(viewerToken, tenantId),
      payload: { answersJson: { q1: 5 } },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode assinar sessão → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${sharedSessionId}/sign`,
      headers: authHeaders(viewerToken, tenantId),
      payload: { signerName: 'Aluno', agreed: true },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode criar paciente → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(viewerToken, tenantId),
      payload: { fullName: 'Paciente do Aluno', email: `aluno-patient-${Date.now()}@test.com` },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode atualizar paciente → 403', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/patients/${sharedPatientId}`,
      headers: authHeaders(viewerToken, tenantId),
      payload: { fullName: 'Modificado pelo Aluno' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode criar usuário → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(viewerToken, tenantId),
      payload: { email: `aluno-creates-${Date.now()}@test.com`, password: STRONG_PASSWORD, role: 'viewer' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode criar tenant → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tenants',
      headers: authHeaders(viewerToken, tenantId),
      payload: { name: 'Tenant do Aluno' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode visualizar logs de auditoria → 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/audit',
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode gerar insights de AI (somente leitura, não criação) → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/ai/insights',
      headers: authHeaders(viewerToken, tenantId),
      payload: { sessionId: sharedSessionId },
    });
    expect(res.statusCode).toBe(403);
  });
});
