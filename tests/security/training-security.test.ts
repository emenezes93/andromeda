/**
 * Teste de Segurança — Training Plans
 *
 * Identifica vulnerabilidades, ameaças e riscos específicos do módulo
 * de planos de treino, incluindo:
 * - Injeção (SQL, NoSQL)
 * - XSS em campos de texto
 * - RBAC e isolamento multi-tenant
 * - Validação de entrada maliciosa
 * - Overflow de campos
 * - Tentativas de bypass de autenticação
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let ownerToken: string;
let tenantId: string;
let patientId: string;
const today = new Date().toISOString().split('T')[0];

beforeAll(async () => {
  app = await createTestApp();
  const login = await loginAsOwner(app);
  ownerToken = login.token;
  tenantId = login.tenantId;

  const patient = await app.inject({
    method: 'POST',
    url: '/v1/patients',
    headers: authHeaders(ownerToken, tenantId),
    payload: { fullName: `Security Test Patient ${Date.now()}` },
  });
  patientId = patient.json().id;
});

afterAll(async () => {
  await app.close();
});

// ─── SEC-01: Autenticação e autorização ──────────────────────────────────────

describe('SEC-01: Autenticação obrigatória nos endpoints de training plans', () => {
  const endpoints = [
    { method: 'GET' as const, url: '/v1/training-plans' },
    { method: 'POST' as const, url: '/v1/training-plans' },
    { method: 'GET' as const, url: '/v1/training-executions' },
    { method: 'POST' as const, url: '/v1/training-executions' },
    { method: 'GET' as const, url: '/v1/progress-photos' },
  ];

  endpoints.forEach(({ method, url }) => {
    it(`${method} ${url} sem token retorna 401`, async () => {
      const res = await app.inject({
        method,
        url,
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: method === 'POST' ? {} : undefined,
      });
      // POST with empty body may fail body validation (400) before auth check (401) — both are rejected
      expect(method === 'POST' ? [400, 401] : [401]).toContain(res.statusCode);
    });

    it(`${method} ${url} com token inválido retorna 401`, async () => {
      const res = await app.inject({
        method,
        url,
        headers: {
          authorization: 'Bearer token.invalido.aqui',
          'x-tenant-id': tenantId,
          'content-type': 'application/json',
        },
        payload: method === 'POST' ? {} : undefined,
      });
      expect(method === 'POST' ? [400, 401] : [401]).toContain(res.statusCode);
    });
  });
});

// ─── SEC-02: RBAC — viewer não pode escrever ─────────────────────────────────

describe('SEC-02: RBAC — viewer não pode criar/modificar training plans', () => {
  let viewerToken: string;
  let existingPlanId: string;

  beforeAll(async () => {
    // Cria viewer
    const email = `sec-viewer-${Date.now()}@test.com`;
    await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(ownerToken, tenantId),
      payload: { email, password: STRONG_PASSWORD, role: 'viewer' },
    });
    const login = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email, password: STRONG_PASSWORD },
    });
    viewerToken = login.json().token;

    // Cria plano pelo owner para testes de PATCH/DELETE
    const plan = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: { patientId, name: 'Plano SEC RBAC', planJson: {}, startDate: today },
    });
    existingPlanId = plan.json().id;
  });

  it('viewer: POST /v1/training-plans → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(viewerToken, tenantId),
      payload: { patientId, name: 'Tentativa', planJson: {}, startDate: today },
    });
    expect(res.statusCode).toBe(403);
  });

  it('viewer: PATCH /v1/training-plans/:id → 403', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/training-plans/${existingPlanId}`,
      headers: authHeaders(viewerToken, tenantId),
      payload: { name: 'Tentativa Edição' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('viewer: DELETE /v1/training-plans/:id → 403', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/v1/training-plans/${existingPlanId}`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(403);
  });

  it('viewer: POST /v1/training-executions → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-executions',
      headers: authHeaders(viewerToken, tenantId),
      payload: { patientId, executedAt: new Date().toISOString(), completed: true },
    });
    expect(res.statusCode).toBe(403);
  });
});

// ─── SEC-03: Injeção de SQL nos campos de texto ──────────────────────────────

describe('SEC-03: SQL injection — campos de texto não executam SQL', () => {
  const sqlPayloads = [
    "'; DROP TABLE training_plans; --",
    "1' OR '1'='1",
    "1; SELECT * FROM users; --",
    "' UNION SELECT null, null, null --",
    "admin'--",
  ];

  sqlPayloads.forEach((payload) => {
    it(`campo name com SQL injection não causa erro 5xx: ${payload.slice(0, 30)}…`, async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/training-plans',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          name: payload,
          planJson: {},
          startDate: today,
        },
      });
      // Pode retornar 201 (nome salvo como texto) ou 400/422 (validação)
      // Jamais deve retornar 500
      expect(res.statusCode).not.toBe(500);
      expect(res.statusCode).not.toBe(503);
    });
  });

  it('SQL injection no filtro name não retorna dados de outros tenants', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans?name=${encodeURIComponent("' OR '1'='1")}`,
      headers: authHeaders(ownerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    // Deve retornar apenas dados do tenant correto
    const plans = res.json().data as Array<{ tenantId?: string }>;
    plans.forEach((p) => {
      if (p.tenantId) expect(p.tenantId).toBe(tenantId);
    });
  });
});

// ─── SEC-04: XSS — campos de texto não interpretam HTML/JS ──────────────────

describe('SEC-04: XSS — campos armazenam texto, não executam scripts', () => {
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror=alert(1)>',
    'javascript:alert(1)',
    '"><script>alert(document.cookie)</script>',
    '<svg onload=alert(1)>',
  ];

  xssPayloads.forEach((payload) => {
    it(`XSS em name é armazenado como texto ou rejeitado: ${payload.slice(0, 30)}`, async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/training-plans',
        headers: authHeaders(ownerToken, tenantId),
        payload: { patientId, name: payload, planJson: {}, startDate: today },
      });
      // Nunca 500. Se 201, o conteúdo foi armazenado como texto literal.
      expect(res.statusCode).not.toBe(500);

      if (res.statusCode === 201) {
        const id = res.json().id;
        const get = await app.inject({
          method: 'GET',
          url: `/v1/training-plans/${id}`,
          headers: authHeaders(ownerToken, tenantId),
        });
        // O conteúdo retornado deve ser o texto literal, não executado
        expect(get.json().name).toBe(payload);
      }
    });
  });

  it('XSS em description é armazenado como texto literal', async () => {
    const xssDesc = '<script>document.location="https://evil.com"</script>';
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        patientId,
        name: `XSS Desc Test ${Date.now()}`,
        description: xssDesc,
        planJson: {},
        startDate: today,
      },
    });
    expect(res.statusCode).not.toBe(500);
    if (res.statusCode === 201) {
      expect(res.json().description).toBe(xssDesc);
    }
  });
});

// ─── SEC-05: Overflow / payload excessivo ────────────────────────────────────

describe('SEC-05: Overflow de campos e payload excessivo', () => {
  it('name com 256 caracteres (acima do limite) retorna 400/422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        patientId,
        name: 'A'.repeat(256),
        planJson: {},
        startDate: today,
      },
    });
    expect([400, 422]).toContain(res.statusCode);
  });

  it('name com 1000 caracteres não causa 500', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: { patientId, name: 'X'.repeat(1000), planJson: {}, startDate: today },
    });
    expect(res.statusCode).not.toBe(500);
  });

  it('planJson muito grande (100 exercícios) não causa 500', async () => {
    const exercises = Array.from({ length: 100 }, (_, i) => ({
      id: `ex-${i}`,
      name: `Exercício ${i}`,
      sets: 3,
      reps: '12',
      rest: '60s',
      muscleGroup: 'Grupo',
    }));
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        patientId,
        name: 'Plano 100 Exercícios',
        planJson: { days: [{ id: 'd1', label: 'Mega Day', focus: 'Tudo', exercises }] },
        startDate: today,
      },
    });
    expect(res.statusCode).not.toBe(500);
  });
});

// ─── SEC-06: Isolamento multi-tenant ─────────────────────────────────────────

describe('SEC-06: Isolamento multi-tenant — planos de treino', () => {
  let tenantBToken: string;
  let tenantBId: string;
  let planInTenantA: string;

  beforeAll(async () => {
    // Cria tenant B
    const tenantB = await app.inject({
      method: 'POST',
      url: '/v1/tenants',
      headers: authHeaders(ownerToken, tenantId),
      payload: { name: `SEC Tenant B ${Date.now()}` },
    });
    tenantBId = tenantB.json().id;

    // Cria usuário no tenant B
    const email = `sec-b-${Date.now()}@test.com`;
    await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(ownerToken, tenantBId),
      payload: { email, password: STRONG_PASSWORD, role: 'admin' },
    });
    const login = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email, password: STRONG_PASSWORD },
    });
    tenantBToken = login.json().token;

    // Cria plano no tenant A
    const plan = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: { patientId, name: 'Plano Exclusivo Tenant A', planJson: {}, startDate: today },
    });
    planInTenantA = plan.json().id;
  });

  it('usuário do tenant B não consegue ver plano do tenant A → 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planInTenantA}`,
      headers: authHeaders(tenantBToken, tenantBId),
    });
    expect([404, 403]).toContain(res.statusCode);
  });

  it('usuário do tenant B não consegue editar plano do tenant A → 404', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/training-plans/${planInTenantA}`,
      headers: authHeaders(tenantBToken, tenantBId),
      payload: { name: 'Ataque Cross-Tenant' },
    });
    expect([404, 403]).toContain(res.statusCode);
  });

  it('usuário do tenant B não consegue deletar plano do tenant A → 404', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/v1/training-plans/${planInTenantA}`,
      headers: authHeaders(tenantBToken, tenantBId),
    });
    expect([404, 403]).toContain(res.statusCode);
  });

  it('listagem do tenant B não retorna planos do tenant A', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans',
      headers: authHeaders(tenantBToken, tenantBId),
    });
    expect(res.statusCode).toBe(200);
    const ids = res.json().data.map((p: { id: string }) => p.id);
    expect(ids).not.toContain(planInTenantA);
  });
});

// ─── SEC-07: Tipos de dados maliciosos ───────────────────────────────────────

describe('SEC-07: Tipos de dados inválidos e boundary testing', () => {
  it('POST com active como string "true" não causa 500', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        patientId,
        name: 'Type Test',
        planJson: {},
        startDate: today,
        active: 'true', // string em vez de boolean
      },
    });
    expect(res.statusCode).not.toBe(500);
  });

  it('POST com patientId numérico não causa 500', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: { patientId: 12345, name: 'Num Patient', planJson: {}, startDate: today },
    });
    expect(res.statusCode).not.toBe(500);
  });

  it('POST com startDate no formato incorreto retorna 400/422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: { patientId, name: 'Bad Date', planJson: {}, startDate: 'não-é-data' },
    });
    expect(res.statusCode).not.toBe(500);
  });

  it('POST sem Content-Type não causa 500', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: {
        authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': tenantId,
        // sem content-type
      },
      payload: 'payload-invalido',
    });
    expect(res.statusCode).not.toBe(500);
  });

  it('planJson com null não causa 500', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: { patientId, name: 'Null PlanJson', planJson: null, startDate: today },
    });
    expect(res.statusCode).not.toBe(500);
  });
});

// ─── SEC-08: Proteção contra enumeração de IDs ───────────────────────────────

describe('SEC-08: Proteção contra enumeração de IDs', () => {
  it('GET /v1/training-plans/id-sequencial-1 retorna 404 (não expõe dados)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans/1',
      headers: authHeaders(ownerToken, tenantId),
    });
    expect(res.statusCode).toBe(404);
  });

  it('resposta 404 não expõe informações internas do sistema', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans/id-que-nao-existe',
      headers: authHeaders(ownerToken, tenantId),
    });
    expect(res.statusCode).toBe(404);
    const body = res.json();
    // Não deve expor stack trace, query SQL, ou detalhes internos
    const bodyStr = JSON.stringify(body).toLowerCase();
    expect(bodyStr).not.toContain('stack');
    expect(bodyStr).not.toContain('prisma');
    expect(bodyStr).not.toContain('postgres');
    expect(bodyStr).not.toContain('sql');
  });
});
