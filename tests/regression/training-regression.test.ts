/**
 * Teste de Regressão — Training Plans
 *
 * Garante que as mudanças (novo wizard de criação, templates, formato de days)
 * não quebraram funcionalidades previamente existentes.
 * Todos os testes aqui devem continuar passando após qualquer alteração de código.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let token: string;
let tenantId: string;
let patientId: string;

const today = new Date().toISOString().split('T')[0];
const future = new Date(Date.now() + 60 * 86400_000).toISOString().split('T')[0];

beforeAll(async () => {
  app = await createTestApp();
  const login = await loginAsOwner(app);
  token = login.token;
  tenantId = login.tenantId;

  const res = await app.inject({
    method: 'POST',
    url: '/v1/patients',
    headers: authHeaders(token, tenantId),
    payload: {
      fullName: `Regression Patient ${Date.now()}`,
      email: `regression-${Date.now()}@test.com`,
    },
  });
  patientId = res.json().id;
}, 30000);

afterAll(async () => {
  await app.close();
});

// ─── REG-01: Formato legado de planJson ainda funciona ──────────────────────

describe('REG-01: Compatibilidade com formato legado de planJson', () => {
  it('cria plano com formato legado {exercises:[...]} → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        name: 'Plano Legado',
        planJson: {
          exercises: [
            { name: 'Agachamento', sets: 3, reps: '12' },
            { name: 'Supino', sets: 4, reps: '10' },
          ],
        },
        startDate: today,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.planJson.exercises).toHaveLength(2);
  });

  it('cria plano com planJson vazio {} → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: { patientId, name: 'Plano Vazio', planJson: {}, startDate: today },
    });
    expect(res.statusCode).toBe(201);
  });

  it('cria plano com planJson arbitrário (estrutura livre) → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        name: 'Plano Customizado',
        planJson: {
          semana: 1,
          objetivo: 'hipertrofia',
          treinos: [{ dia: 'segunda', foco: 'peito' }],
        },
        startDate: today,
      },
    });
    expect(res.statusCode).toBe(201);
  });
});

// ─── REG-02: Endpoints de CRUD permanecem funcionais ────────────────────────

describe('REG-02: Endpoints de CRUD inalterados', () => {
  let planId: string;

  it('POST /v1/training-plans retorna 201 com id e campos corretos', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        name: 'Plano Regressão CRUD',
        description: 'Teste de regressão',
        planJson: { exercises: [] },
        startDate: today,
        endDate: future,
        active: true,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    planId = body.id;
    expect(body.id).toBeDefined();
    expect(body.patientId).toBe(patientId);
    expect(body.name).toBe('Plano Regressão CRUD');
    expect(body.description).toBe('Teste de regressão');
    expect(body.active).toBe(true);
    expect(body.startDate).toBeDefined();
    expect(body.endDate).toBeDefined();
    expect(body.executionsCount).toBe(0);
    expect(body.patientName).toBeDefined();
  });

  it('GET /v1/training-plans retorna paginação com meta', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
    expect(typeof body.meta.total).toBe('number');
    expect(typeof body.meta.page).toBe('number');
    expect(typeof body.meta.limit).toBe('number');
    expect(typeof body.meta.totalPages).toBe('number');
    expect(typeof body.meta.hasMore).toBe('boolean');
  });

  it('GET /v1/training-plans/:id retorna campos completos', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.id).toBe(planId);
    expect(body.patientId).toBeDefined();
    expect(body.patientName).toBeDefined();
    expect(body.executionsCount).toBeDefined();
    expect(body.planJson).toBeDefined();
  });

  it('PATCH /v1/training-plans/:id retorna plano atualizado', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
      payload: { name: 'Nome Atualizado Regressão', active: false },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().name).toBe('Nome Atualizado Regressão');
    expect(res.json().active).toBe(false);
  });

  it('DELETE /v1/training-plans/:id retorna 204 sem corpo', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: { patientId, name: 'Para deletar REG', planJson: {}, startDate: today },
    });
    const id = create.json().id;

    const del = await app.inject({
      method: 'DELETE',
      url: `/v1/training-plans/${id}`,
      headers: authHeaders(token, tenantId),
    });
    expect(del.statusCode).toBe(204);
    expect(del.body).toBe('');
  });
});

// ─── REG-03: Auth flow não foi afetado ──────────────────────────────────────

describe('REG-03: Fluxo de autenticação inalterado', () => {
  it('login com credenciais válidas retorna token e refreshToken', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'owner@demo.com', password: 'owner123' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.token).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user).toBeDefined();
    expect(body.user.role).toBe('owner');
  });

  it('refresh token funciona após login', async () => {
    const login = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'owner@demo.com', password: 'owner123' },
    });
    const { refreshToken } = login.json();

    const refresh = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: { refreshToken },
    });
    expect(refresh.statusCode).toBe(200);
    expect(refresh.json().token).toBeDefined();
  });
});

// ─── REG-04: Training executions inalteradas ─────────────────────────────────

describe('REG-04: Training Executions inalteradas', () => {
  let planId: string;

  beforeAll(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: { patientId, name: 'Plano Exec REG', planJson: {}, startDate: today },
    });
    planId = res.json().id;
  });

  it('POST /v1/training-executions com plano → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-executions',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        trainingPlanId: planId,
        executedAt: new Date().toISOString(),
        durationMinutes: 60,
        completed: true,
        notes: 'Regressão OK',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.patientId).toBe(patientId);
    expect(body.trainingPlanId).toBe(planId);
    expect(body.completed).toBe(true);
    expect(body.durationMinutes).toBe(60);
  });

  it('GET /v1/training-executions retorna lista paginada', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-executions',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
    expect(res.json().meta).toBeDefined();
  });
});

// ─── REG-05: Paginação inalterada ────────────────────────────────────────────

describe('REG-05: Paginação de planos de treino', () => {
  it('parâmetros page e limit funcionam', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans?page=1&limit=2',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeLessThanOrEqual(2);
    expect(body.meta.page).toBe(1);
    expect(body.meta.limit).toBe(2);
  });

  it('page=1 e page=2 retornam registros diferentes (se houver)', async () => {
    const p1 = await app.inject({
      method: 'GET',
      url: '/v1/training-plans?page=1&limit=1',
      headers: authHeaders(token, tenantId),
    });
    const p2 = await app.inject({
      method: 'GET',
      url: '/v1/training-plans?page=2&limit=1',
      headers: authHeaders(token, tenantId),
    });

    if (p1.json().meta.total >= 2) {
      const id1 = p1.json().data[0]?.id;
      const id2 = p2.json().data[0]?.id;
      expect(id1).not.toBe(id2);
    }
  });

  it('limit inválido retorna erro', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans?limit=999',
      headers: authHeaders(token, tenantId),
    });
    expect([400, 422]).toContain(res.statusCode);
  });
});
