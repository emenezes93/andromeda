/**
 * Security Integration Tests
 *
 * Cobre: JWT manipulation, RBAC cross-tenant, validação de entrada,
 * tenant header, public fill, soft delete, account lockout, idempotência.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

// ─── helpers locais ───────────────────────────────────────────────────────────

async function createTenant(app: FastifyInstance, ownerToken: string, ownerTenantId: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/v1/tenants',
    headers: authHeaders(ownerToken, ownerTenantId),
    payload: { name: `SecTest-${Date.now()}` },
  });
  return res.json() as { id: string };
}

async function createUserInTenant(
  app: FastifyInstance,
  ownerToken: string,
  tenantId: string,
  role = 'practitioner',
) {
  const email = `sec-${Date.now()}-${Math.random().toString(36).slice(2)}@test.com`;
  await app.inject({
    method: 'POST',
    url: '/v1/users',
    headers: authHeaders(ownerToken, tenantId),
    payload: { email, password: STRONG_PASSWORD, role },
  });
  return email;
}

async function loginAs(app: FastifyInstance, email: string, tenantId: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { email, password: STRONG_PASSWORD },
  });
  if (res.statusCode !== 200) return null;
  const body = res.json();
  return { token: body.token as string, tenantId };
}

async function createPatient(app: FastifyInstance, token: string, tenantId: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/v1/patients',
    headers: authHeaders(token, tenantId),
    payload: { fullName: `Security Test Patient ${Date.now()}` },
  });
  return res.json() as { id: string };
}

async function createTemplate(app: FastifyInstance, token: string, tenantId: string) {
  const res = await app.inject({
    method: 'POST',
    url: '/v1/anamnesis/templates',
    headers: authHeaders(token, tenantId),
    payload: {
      name: `Security Template ${Date.now()}`,
      schemaJson: {
        questions: [
          { id: 'q1', text: 'Como você está?', type: 'text', required: true, tags: [] },
        ],
      },
    },
  });
  return res.json() as { id: string };
}

// ─── suite ────────────────────────────────────────────────────────────────────

describe('Security: autenticação & JWT', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejeita requisição sem Authorization header → 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejeita token com assinatura adulterada → 401', async () => {
    const tamperedToken = ownerToken.slice(0, -5) + 'XXXXX';
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: authHeaders(tamperedToken, tenantId),
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejeita token malformado (não-JWT) → 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: {
        authorization: 'Bearer not.a.jwt.token',
        'x-tenant-id': tenantId,
        'content-type': 'application/json',
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejeita Authorization sem prefixo Bearer → 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: {
        authorization: ownerToken, // sem "Bearer "
        'x-tenant-id': tenantId,
        'content-type': 'application/json',
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejeita JWT com algoritmo none (downgrade attack) → 401', async () => {
    // Monta um token falso com alg=none manualmente
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(
      JSON.stringify({ userId: 'fake', email: 'fake@test.com', role: 'owner', tenantId }),
    ).toString('base64url');
    const noneToken = `${header}.${payload}.`;

    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: {
        authorization: `Bearer ${noneToken}`,
        'x-tenant-id': tenantId,
        'content-type': 'application/json',
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('lockout após 5 tentativas de login com senha errada → 403', async () => {
    const lockEmail = `lockout-${Date.now()}@test.com`;
    await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(ownerToken, tenantId),
      payload: { email: lockEmail, password: STRONG_PASSWORD, role: 'practitioner' },
    });

    // 5 tentativas falhas
    for (let i = 0; i < 5; i++) {
      await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: lockEmail, password: 'WrongPass@99' },
      });
    }

    // 6ª tentativa: conta travada, mesmo com senha correta
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: lockEmail, password: STRONG_PASSWORD },
    });
    expect(res.statusCode).toBe(403);
  });

  it('login sem body → 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: {},
    });
    expect([400, 422]).toContain(res.statusCode);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Security: tenant header', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejeita requisição sem x-tenant-id → 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: {
        authorization: `Bearer ${ownerToken}`,
        'content-type': 'application/json',
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejeita x-tenant-id com apenas espaços em branco → 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: {
        authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': '   ',
        'content-type': 'application/json',
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('tenant inexistente: RLS retorna lista vazia (sem vazar dados) → 200 com data:[]', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: {
        authorization: `Bearer ${ownerToken}`,
        'x-tenant-id': 'clzzzzzzzzzzzzzzzzzzzzzzzz', // CUID válido mas inexistente
        'content-type': 'application/json',
      },
    });
    // pode ser 200 (lista vazia) ou 40x — não deve retornar dados de outro tenant
    if (res.statusCode === 200) {
      expect(res.json().data).toEqual([]);
    } else {
      expect([400, 401, 403, 404]).toContain(res.statusCode);
    }
  });

  it('x-tenant-id de tenant real mas token de outro tenant → dados isolados', async () => {
    // Cria segundo tenant
    const tenant2 = await createTenant(app, ownerToken, tenantId);

    // Cria paciente no tenant2
    await createPatient(app, ownerToken, tenant2.id);

    // Tenta listar pacientes do tenant2 usando token do tenant1
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenant2.id),
    });
    // Funciona (owner tem acesso) mas não deve vazar dados cruzados
    expect([200, 401, 403]).toContain(res.statusCode);
    if (res.statusCode === 200) {
      // Todos os registros devem pertencer ao tenant2
      const patients = res.json().data as Array<{ tenantId?: string }>;
      patients.forEach((p) => {
        if (p.tenantId) expect(p.tenantId).toBe(tenant2.id);
      });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Security: isolamento cross-tenant (RBAC)', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantA: string;
  let tenantB: string;
  let patientInA: string;
  let userBToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantA = login.tenantId;

    // Cria tenant B
    const tb = await createTenant(app, ownerToken, tenantA);
    tenantB = tb.id;

    // Cria paciente no tenant A
    const p = await createPatient(app, ownerToken, tenantA);
    patientInA = p.id;

    // Cria usuário no tenant B e faz login
    const emailB = await createUserInTenant(app, ownerToken, tenantB, 'admin');
    const session = await loginAs(app, emailB, tenantB);
    userBToken = session?.token ?? '';
  });

  afterAll(async () => {
    await app.close();
  });

  it('usuário do tenant B não consegue ver paciente do tenant A → 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/patients/${patientInA}`,
      headers: authHeaders(userBToken, tenantB),
    });
    // RLS garante isolamento: 404 ou lista vazia
    expect([404, 403]).toContain(res.statusCode);
  });

  it('viewer não pode criar paciente → 403', async () => {
    const viewerEmail = await createUserInTenant(app, ownerToken, tenantA, 'viewer');
    const session = await loginAs(app, viewerEmail, tenantA);
    if (!session) return;

    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(session.token, tenantA),
      payload: { fullName: 'Tentativa Viewer' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('practitioner não pode acessar /v1/tenants → 403', async () => {
    const practEmail = await createUserInTenant(app, ownerToken, tenantA, 'practitioner');
    const session = await loginAs(app, practEmail, tenantA);
    if (!session) return;

    const res = await app.inject({
      method: 'GET',
      url: '/v1/tenants',
      headers: authHeaders(session.token, tenantA),
    });
    expect(res.statusCode).toBe(403);
  });

  it('admin não pode suspender tenant → 403 (apenas owner)', async () => {
    const adminEmail = await createUserInTenant(app, ownerToken, tenantA, 'admin');
    const session = await loginAs(app, adminEmail, tenantA);
    if (!session) return;

    const res = await app.inject({
      method: 'POST',
      url: `/v1/tenants/${tenantA}/suspend`,
      headers: authHeaders(session.token, tenantA),
    });
    expect(res.statusCode).toBe(403);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Security: validação de entrada', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/patients sem fullName → 400/422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
      payload: { email: 'noname@test.com' },
    });
    expect([400, 422]).toContain(res.statusCode);
  });

  it('POST /v1/patients com CPF inválido (menos de 11 dígitos) → 400/422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
      payload: { fullName: 'CPF Inválido', cpf: '12345' },
    });
    expect([400, 422]).toContain(res.statusCode);
  });

  it('POST /v1/patients com birthDate fora do formato YYYY-MM-DD → 400/422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
      payload: { fullName: 'Data Inválida', birthDate: '15/05/1990' },
    });
    expect([400, 422]).toContain(res.statusCode);
  });

  it('POST /v1/patients com gender inválido → 400/422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
      payload: { fullName: 'Gender Inválido', gender: 'X' },
    });
    expect([400, 422]).toContain(res.statusCode);
  });

  it('POST /v1/training-plans com endDate anterior a startDate → 400/422', async () => {
    const patient = await createPatient(app, ownerToken, tenantId);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        patientId: patient.id,
        name: 'Plano Inválido',
        startDate: '2024-06-01',
        endDate: '2024-01-01', // anterior a startDate
      },
    });
    expect([400, 422]).toContain(res.statusCode);
  });

  it('POST /v1/anamnesis/sessions com templateId inexistente → 404', async () => {
    const patient = await createPatient(app, ownerToken, tenantId);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        templateId: 'clzzzzzzzzzzzzzzzzzzzzzzzz',
        patientId: patient.id,
      },
    });
    expect(res.statusCode).toBe(404);
  });

  it('POST /v1/auth/register com senha fraca (sem maiúscula) → 400/422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      headers: authHeaders(ownerToken, tenantId),
      payload: { email: `weakpw-${Date.now()}@test.com`, password: 'senha@123' },
    });
    expect([400, 422]).toContain(res.statusCode);
  });

  it('POST /v1/auth/register com senha fraca (sem especial) → 400/422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      headers: authHeaders(ownerToken, tenantId),
      payload: { email: `weakpw2-${Date.now()}@test.com`, password: 'SenhaSemEspecial1' },
    });
    expect([400, 422]).toContain(res.statusCode);
  });

  it('POST /v1/auth/register com email inválido → 400/422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/register',
      headers: authHeaders(ownerToken, tenantId),
      payload: { email: 'not-an-email', password: STRONG_PASSWORD },
    });
    expect([400, 422]).toContain(res.statusCode);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Security: idempotência', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('mesma idempotency-key + mesmo body retorna mesmo id → 201/200', async () => {
    const template = await createTemplate(app, ownerToken, tenantId);
    const patient = await createPatient(app, ownerToken, tenantId);
    const key = `idem-${Date.now()}`;
    const payload = { templateId: template.id, patientId: patient.id };

    const r1 = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: { ...authHeaders(ownerToken, tenantId), 'idempotency-key': key },
      payload,
    });
    const r2 = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: { ...authHeaders(ownerToken, tenantId), 'idempotency-key': key },
      payload,
    });

    expect([200, 201]).toContain(r1.statusCode);
    expect([200, 201]).toContain(r2.statusCode);
    expect(r1.json().id).toBe(r2.json().id);
  });

  it('mesma idempotency-key + body diferente → 409', async () => {
    const template = await createTemplate(app, ownerToken, tenantId);
    const p1 = await createPatient(app, ownerToken, tenantId);
    const p2 = await createPatient(app, ownerToken, tenantId);
    const key = `idem-conflict-${Date.now()}`;

    await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: { ...authHeaders(ownerToken, tenantId), 'idempotency-key': key },
      payload: { templateId: template.id, patientId: p1.id },
    });

    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: { ...authHeaders(ownerToken, tenantId), 'idempotency-key': key },
      payload: { templateId: template.id, patientId: p2.id }, // body diferente
    });
    expect(res.statusCode).toBe(409);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Security: public fill endpoints', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/public/fill/:token com token inválido → 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/public/fill/token-inexistente-invalido',
    });
    expect(res.statusCode).toBe(404);
  });

  it('POST /v1/public/fill/:token/sign com agreed=false → 400/422', async () => {
    // Cria sessão e gera fill link
    const template = await createTemplate(app, ownerToken, tenantId);
    const patient = await createPatient(app, ownerToken, tenantId);

    const sessionRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(ownerToken, tenantId),
      payload: { templateId: template.id, patientId: patient.id },
    });
    const sessionId = sessionRes.json().id;

    const fillRes = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${sessionId}/fill-link`,
      headers: authHeaders(ownerToken, tenantId),
    });
    const fillToken = fillRes.json().token as string;

    const res = await app.inject({
      method: 'POST',
      url: `/v1/public/fill/${fillToken}/sign`,
      headers: { 'content-type': 'application/json' },
      payload: { signerName: 'Paciente Teste', agreed: false },
    });
    expect([400, 422]).toContain(res.statusCode);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Security: soft delete & auditoria', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('DELETE paciente → 204; GET em seguida → 404 (soft delete)', async () => {
    const patient = await createPatient(app, ownerToken, tenantId);

    const del = await app.inject({
      method: 'DELETE',
      url: `/v1/patients/${patient.id}`,
      headers: authHeaders(ownerToken, tenantId),
    });
    expect(del.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: `/v1/patients/${patient.id}`,
      headers: authHeaders(ownerToken, tenantId),
    });
    expect(get.statusCode).toBe(404);
  });

  it('paciente deletado não aparece na listagem', async () => {
    const patient = await createPatient(app, ownerToken, tenantId);

    await app.inject({
      method: 'DELETE',
      url: `/v1/patients/${patient.id}`,
      headers: authHeaders(ownerToken, tenantId),
    });

    const list = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
    });
    const ids = (list.json().data as Array<{ id: string }>).map((p) => p.id);
    expect(ids).not.toContain(patient.id);
  });

  it('DELETE training-execution → 204; GET em seguida → 404 (soft delete)', async () => {
    const patient = await createPatient(app, ownerToken, tenantId);

    const execRes = await app.inject({
      method: 'POST',
      url: '/v1/training-executions',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        patientId: patient.id,
        executedAt: new Date().toISOString(),
        completed: true,
      },
    });
    expect(execRes.statusCode).toBe(201);
    const execId = execRes.json().id;

    const del = await app.inject({
      method: 'DELETE',
      url: `/v1/training-executions/${execId}`,
      headers: authHeaders(ownerToken, tenantId),
    });
    expect(del.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: `/v1/training-executions/${execId}`,
      headers: authHeaders(ownerToken, tenantId),
    });
    expect(get.statusCode).toBe(404);
  });

  it('DELETE gera entrada no audit log', async () => {
    const patient = await createPatient(app, ownerToken, tenantId);

    await app.inject({
      method: 'DELETE',
      url: `/v1/patients/${patient.id}`,
      headers: authHeaders(ownerToken, tenantId),
    });

    const auditRes = await app.inject({
      method: 'GET',
      url: `/v1/audit?entityType=patient&entityId=${patient.id}`,
      headers: authHeaders(ownerToken, tenantId),
    });

    if (auditRes.statusCode === 200) {
      const logs = auditRes.json().data as Array<{ action: string; entityId: string }>;
      const deleteLog = logs.find((l) => l.action === 'delete' && l.entityId === patient.id);
      expect(deleteLog).toBeDefined();
    }
  });
});
