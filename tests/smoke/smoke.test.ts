/**
 * Smoke Testing — Teste de Fumaça
 *
 * Verifica se as funcionalidades críticas básicas estão funcionando
 * após um build/deploy. Execução rápida, sem dependências externas complexas.
 * Deve ser o primeiro teste a rodar em CI/CD.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let token: string;
let tenantId: string;

beforeAll(async () => {
  app = await createTestApp();
  const login = await loginAsOwner(app);
  token = login.token;
  tenantId = login.tenantId;
});

afterAll(async () => {
  await app.close();
});

// ─── Infraestrutura ─────────────────────────────────────────────────────────

describe('Smoke: infraestrutura', () => {
  it('GET /health retorna 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
  });

  it('GET /ready retorna 200 ou 503', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect([200, 503]).toContain(res.statusCode);
  });

  it('GET /documentation retorna 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/documentation' });
    expect([200, 301, 302]).toContain(res.statusCode);
  });
});

// ─── Autenticação ────────────────────────────────────────────────────────────

describe('Smoke: autenticação', () => {
  it('POST /v1/auth/login com credenciais válidas retorna token', async () => {
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
    expect(body.user.tenantId).toBeDefined();
  });

  it('POST /v1/auth/login com credenciais inválidas retorna 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'ninguem@test.com', password: 'SenhaErrada@1' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('endpoint protegido sem token retorna 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(401);
  });
});

// ─── CRUD básico ─────────────────────────────────────────────────────────────

describe('Smoke: CRUD crítico', () => {
  let patientId: string;
  let planId: string;

  it('GET /v1/patients (autenticado) retorna lista → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('POST /v1/patients cria paciente → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(token, tenantId),
      payload: {
        fullName: `Smoke Patient ${Date.now()}`,
        email: `smoke-${Date.now()}@test.com`,
      },
    });
    expect(res.statusCode).toBe(201);
    patientId = res.json().id;
    expect(patientId).toBeDefined();
  });

  it('GET /v1/training-plans retorna lista → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('POST /v1/training-plans cria plano → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        name: 'Smoke Treino',
        planJson: { exercises: [] },
        startDate: new Date().toISOString().split('T')[0],
      },
    });
    expect(res.statusCode).toBe(201);
    planId = res.json().id;
    expect(planId).toBeDefined();
  });

  it('GET /v1/training-plans/:id retorna plano criado → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().id).toBe(planId);
  });

  it('GET /v1/anamnesis/templates retorna lista → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });
});

// ─── Resposta estruturada ───────────────────────────────────────────────────

describe('Smoke: formato de resposta', () => {
  it('respostas de lista têm campos data e meta', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: authHeaders(token, tenantId),
    });
    const body = res.json();
    expect(body).toHaveProperty('data');
    expect(body).toHaveProperty('meta');
    expect(body.meta).toHaveProperty('page');
    expect(body.meta).toHaveProperty('limit');
    expect(body.meta).toHaveProperty('total');
    expect(body.meta).toHaveProperty('totalPages');
  });

  it('erros têm campo message', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients/id-inexistente',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body).toHaveProperty('error');
  });
});
