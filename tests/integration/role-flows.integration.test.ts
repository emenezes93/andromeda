/**
 * Role-flows integration tests
 * Validates the platform flow for Administrador (admin), Personal (practitioner), and Aluno (viewer).
 * Each section covers happy-path flows and access-restriction (403) checks.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';

// ── shared state ──────────────────────────────────────────────────────────────
let app: FastifyInstance;
let tenantId: string;
let ownerToken: string;

let adminToken: string;
let practitionerToken: string;
let viewerToken: string;

let sharedTemplateId: string;
let sharedPatientId: string;
let sharedSessionId: string;

const ts = () => Date.now();

// ── setup / teardown ──────────────────────────────────────────────────────────
beforeAll(async () => {
  app = await createTestApp();

  // Owner login
  const ownerLogin = await loginAsOwner(app);
  ownerToken = ownerLogin.token;
  tenantId = ownerLogin.tenantId;

  // Upgrade tenant plan so we can create users / sessions
  await (app as unknown as { prisma: { tenant: { update: (args: unknown) => Promise<unknown> } } })
    .prisma.tenant.update({
      where: { id: tenantId },
      data: { planTier: 'solo' },
    });

  // ── create users ──────────────────────────────────────────────────────────
  const adminEmail = `admin-rf-${ts()}@test.com`;
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

  const practEmail = `pract-rf-${ts()}@test.com`;
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

  const viewerEmail = `viewer-rf-${ts()}@test.com`;
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

  // ── create shared resources (as owner) ──────────────────────────────────
  const tplRes = await app.inject({
    method: 'POST',
    url: '/v1/anamnesis/templates',
    headers: authHeaders(ownerToken, tenantId),
    payload: {
      name: 'Shared Template RF',
      schemaJson: {
        questions: [
          {
            id: 'q1',
            text: 'Nível de estresse (1-10)',
            type: 'number',
            required: true,
            tags: ['stress'],
          },
          {
            id: 'q2',
            text: 'Qualidade do sono',
            type: 'single_choice',
            required: true,
            options: ['Péssima', 'Regular', 'Boa', 'Excelente'],
            tags: ['sleep'],
          },
        ],
      },
    },
  });
  sharedTemplateId = tplRes.json().id;

  const patRes = await app.inject({
    method: 'POST',
    url: '/v1/patients',
    headers: authHeaders(ownerToken, tenantId),
    payload: { fullName: 'Paciente Shared RF', birthDate: '1990-01-01', gender: 'M' },
  });
  sharedPatientId = patRes.json().id;

  const sessRes = await app.inject({
    method: 'POST',
    url: '/v1/anamnesis/sessions',
    headers: authHeaders(ownerToken, tenantId),
    payload: { templateId: sharedTemplateId, patientId: sharedPatientId },
  });
  sharedSessionId = sessRes.json().id;

  // Submit answers
  await app.inject({
    method: 'POST',
    url: `/v1/anamnesis/sessions/${sharedSessionId}/answers`,
    headers: authHeaders(ownerToken, tenantId),
    payload: { answersJson: { q1: 7, q2: 'Regular' } },
  });

  // Generate AI insights
  await app.inject({
    method: 'POST',
    url: '/v1/anamnesis/insights',
    headers: authHeaders(ownerToken, tenantId),
    payload: { sessionId: sharedSessionId },
  });
}, 40_000);

afterAll(async () => {
  await app?.close();
});

// ═════════════════════════════════════════════════════════════════════════════
// Perfil: Administrador
// ═════════════════════════════════════════════════════════════════════════════
describe('Perfil: Administrador (admin)', () => {
  it('login retorna token válido', () => {
    expect(adminToken).toBeDefined();
    expect(typeof adminToken).toBe('string');
  });

  it('pode criar um usuário com role practitioner → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(adminToken, tenantId),
      payload: {
        email: `admin-created-${ts()}@test.com`,
        password: STRONG_PASSWORD,
        role: 'practitioner',
      },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBeDefined();
  });

  it('pode listar usuários → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/users',
      headers: authHeaders(adminToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('pode desativar um usuário → 200', async () => {
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
    expect(createRes.statusCode).toBe(201);
    const userId = createRes.json().id;
    expect(userId).toBeDefined();

    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/users/${userId}/deactivate`,
      headers: authHeaders(adminToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
  });

  it('pode criar template → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(adminToken, tenantId),
      payload: {
        name: `Template Admin ${ts()}`,
        schemaJson: { questions: [{ id: 'q1', text: 'Test', type: 'text', required: false }] },
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

  it('pode criar paciente → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(adminToken, tenantId),
      payload: { fullName: `Paciente Admin ${ts()}`, birthDate: '1985-06-15', gender: 'F' },
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

  it('pode atualizar paciente → 200', async () => {
    const patRes = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(adminToken, tenantId),
      payload: { fullName: `Pat Update Admin ${ts()}`, birthDate: '1990-01-01', gender: 'M' },
    });
    const patId = patRes.json().id;

    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/patients/${patId}`,
      headers: authHeaders(adminToken, tenantId),
      payload: { mainGoal: 'Perder peso' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('pode criar sessão de anamnese → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(adminToken, tenantId),
      payload: { templateId: sharedTemplateId },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBeDefined();
  });

  it('pode submeter respostas → 201', async () => {
    const sessRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(adminToken, tenantId),
      payload: { templateId: sharedTemplateId },
    });
    const sessionId = sessRes.json().id;

    const res = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${sessionId}/answers`,
      headers: authHeaders(adminToken, tenantId),
      payload: { answersJson: { q1: 5, q2: 'Boa' } },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBeDefined();
  });

  it('pode gerar insights de IA → 200', async () => {
    const sessRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(adminToken, tenantId),
      payload: { templateId: sharedTemplateId },
    });
    const sessionId = sessRes.json().id;

    await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${sessionId}/answers`,
      headers: authHeaders(adminToken, tenantId),
      payload: { answersJson: { q1: 3, q2: 'Péssima' } },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/insights',
      headers: authHeaders(adminToken, tenantId),
      payload: { sessionId },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBeDefined();
    expect(body.summary).toBeDefined();
    expect(body.risksJson).toBeDefined();
    expect(body.recommendationsJson).toBeDefined();
  });

  it('pode visualizar audit log → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/audit',
      headers: authHeaders(adminToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

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

// ═════════════════════════════════════════════════════════════════════════════
// Perfil: Personal (practitioner)
// ═════════════════════════════════════════════════════════════════════════════
describe('Perfil: Personal (practitioner)', () => {
  let practTemplateId: string;
  let practPatientId: string;
  let practSessionId: string;

  it('login retorna token válido', () => {
    expect(practitionerToken).toBeDefined();
    expect(typeof practitionerToken).toBe('string');
  });

  it('pode criar template → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(practitionerToken, tenantId),
      payload: {
        name: `Template Pract ${ts()}`,
        schemaJson: {
          questions: [
            { id: 'q1', text: 'Objetivo do treino', type: 'text', required: true },
          ],
        },
      },
    });
    expect(res.statusCode).toBe(201);
    practTemplateId = res.json().id;
    expect(practTemplateId).toBeDefined();
  });

  it('pode atualizar template → 200', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/anamnesis/templates/${practTemplateId}`,
      headers: authHeaders(practitionerToken, tenantId),
      payload: { name: `Template Pract Updated ${ts()}` },
    });
    expect(res.statusCode).toBe(200);
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

  it('pode obter template por ID → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/anamnesis/templates/${sharedTemplateId}`,
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(sharedTemplateId);
  });

  it('pode criar paciente → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(practitionerToken, tenantId),
      payload: {
        fullName: `Personal Trainer ${ts()}`,
        birthDate: '1995-03-20',
        gender: 'M',
      },
    });
    expect(res.statusCode).toBe(201);
    practPatientId = res.json().id;
    expect(practPatientId).toBeDefined();
  });

  it('pode atualizar paciente → 200', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/patients/${practPatientId}`,
      headers: authHeaders(practitionerToken, tenantId),
      payload: { mainGoal: 'Ganhar massa muscular' },
    });
    expect(res.statusCode).toBe(200);
  });

  it('pode visualizar timeline do paciente → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/patients/${sharedPatientId}/timeline`,
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
  });

  it('pode exportar CSV do paciente → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/patients/${sharedPatientId}/export`,
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
  });

  it('pode criar sessão para paciente → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(practitionerToken, tenantId),
      payload: { templateId: sharedTemplateId, patientId: practPatientId },
    });
    expect(res.statusCode).toBe(201);
    practSessionId = res.json().id;
    expect(practSessionId).toBeDefined();
  });

  it('pode submeter respostas → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${practSessionId}/answers`,
      headers: authHeaders(practitionerToken, tenantId),
      payload: { answersJson: { q1: 6, q2: 'Boa' } },
    });
    expect(res.statusCode).toBe(201);
    expect(res.json().id).toBeDefined();
  });

  it('pode assinar sessão → 200 com signatureName', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${practSessionId}/sign`,
      headers: authHeaders(practitionerToken, tenantId),
      payload: { signerName: 'Personal Trainer', agreed: true },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.signatureName).toBeTruthy();
  });

  it('pode gerar link público de preenchimento → 200', async () => {
    // Create a fresh session (not yet completed) for fill-link
    const newSess = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(practitionerToken, tenantId),
      payload: { templateId: sharedTemplateId },
    });
    const newSessId = newSess.json().id;

    const res = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${newSessId}/fill-link`,
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.fillToken).toBeDefined();
    expect(body.fillUrl).toBeDefined();
  });

  it('pode gerar insights de IA → 200', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/insights',
      headers: authHeaders(practitionerToken, tenantId),
      payload: { sessionId: sharedSessionId },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBeDefined();
    expect(body.summary).toBeDefined();
    expect(body.risksJson).toBeDefined();
    expect(body.recommendationsJson).toBeDefined();
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

  it('NÃO pode criar usuário → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(practitionerToken, tenantId),
      payload: { email: `nope-${ts()}@test.com`, password: STRONG_PASSWORD },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode criar tenant → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tenants',
      headers: authHeaders(practitionerToken, tenantId),
      payload: { name: 'Tenant do Pract' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode visualizar audit log → 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/audit',
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(403);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// Perfil: Aluno (viewer)
// ═════════════════════════════════════════════════════════════════════════════
describe('Perfil: Aluno (viewer)', () => {
  it('login retorna token válido', () => {
    expect(viewerToken).toBeDefined();
    expect(typeof viewerToken).toBe('string');
  });

  it('pode listar templates → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('pode obter template por ID → 200', async () => {
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

  it('pode obter sessão por ID → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/anamnesis/sessions/${sharedSessionId}`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(sharedSessionId);
  });

  it('pode exportar sessão (formato json) → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/anamnesis/sessions/${sharedSessionId}/export?format=json`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.session).toBeDefined();
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

  it('pode visualizar timeline do paciente → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/patients/${sharedPatientId}/timeline`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
  });

  it('pode exportar CSV do paciente → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/patients/${sharedPatientId}/export`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
  });

  it('pode ver insights de IA da sessão → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/anamnesis/sessions/${sharedSessionId}/insights`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBeDefined();
    expect(body.summary).toBeDefined();
    expect(body.risksJson).toBeDefined();
    expect(body.recommendationsJson).toBeDefined();
  });

  it('NÃO pode criar template → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(viewerToken, tenantId),
      payload: {
        name: 'Template do Viewer',
        schemaJson: { questions: [] },
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
      payload: { answersJson: { q1: 1, q2: 'Péssima' } },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode assinar sessão → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${sharedSessionId}/sign`,
      headers: authHeaders(viewerToken, tenantId),
      payload: { signerName: 'Aluno Test', agreed: true },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode criar paciente → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(viewerToken, tenantId),
      payload: { fullName: 'Paciente do Viewer', birthDate: '2000-01-01', gender: 'F' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode atualizar paciente → 403', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/patients/${sharedPatientId}`,
      headers: authHeaders(viewerToken, tenantId),
      payload: { mainGoal: 'hacking' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode criar usuário → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(viewerToken, tenantId),
      payload: { email: `nope-viewer-${ts()}@test.com`, password: STRONG_PASSWORD },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode criar tenant → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tenants',
      headers: authHeaders(viewerToken, tenantId),
      payload: { name: 'Tenant do Viewer' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode visualizar audit log → 403', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/audit',
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(403);
  });

  it('NÃO pode gerar insights de IA → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/insights',
      headers: authHeaders(viewerToken, tenantId),
      payload: { sessionId: sharedSessionId },
    });
    expect(res.statusCode).toBe(403);
  });
});
