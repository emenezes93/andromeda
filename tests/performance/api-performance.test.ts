/**
 * Teste de Desempenho — API Performance
 *
 * Avalia velocidade, estabilidade e comportamento sob carga básica.
 * Mede tempo de resposta e verifica requisições concorrentes.
 * Não requer ferramenta externa (k6/autocannon) — roda no Vitest.
 *
 * Thresholds (ajuste conforme SLA do projeto):
 *   - Health:         < 100ms
 *   - Auth login:     < 800ms
 *   - List endpoints: < 600ms
 *   - Create:         < 1000ms
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

// Thresholds em milissegundos
const T = {
  HEALTH: 100,
  AUTH: 800,
  LIST: 600,
  CREATE: 1000,
  CONCURRENT: 3000,
} as const;

let app: FastifyInstance;
let token: string;
let tenantId: string;
let patientId: string;

function elapsed(start: bigint): number {
  return Number(process.hrtime.bigint() - start) / 1_000_000;
}

beforeAll(async () => {
  app = await createTestApp();
  const login = await loginAsOwner(app);
  token = login.token;
  tenantId = login.tenantId;

  // Cria paciente de teste
  const res = await app.inject({
    method: 'POST',
    url: '/v1/patients',
    headers: authHeaders(token, tenantId),
    payload: { fullName: `Perf Patient ${Date.now()}`, email: `perf-${Date.now()}@test.com` },
  });
  patientId = res.json().id;
}, 30000);

afterAll(async () => {
  await app.close();
});

// ─── Tempo de resposta individual ────────────────────────────────────────────

describe('Performance: tempo de resposta individual', () => {
  it(`GET /health responde em menos de ${T.HEALTH}ms`, async () => {
    const start = process.hrtime.bigint();
    const res = await app.inject({ method: 'GET', url: '/health' });
    const ms = elapsed(start);

    expect(res.statusCode).toBe(200);
    expect(ms).toBeLessThan(T.HEALTH);
  });

  it(`POST /v1/auth/login responde em menos de ${T.AUTH}ms`, async () => {
    const start = process.hrtime.bigint();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'owner@demo.com', password: 'owner123' },
    });
    const ms = elapsed(start);

    expect(res.statusCode).toBe(200);
    expect(ms).toBeLessThan(T.AUTH);
  });

  it(`GET /v1/patients responde em menos de ${T.LIST}ms`, async () => {
    const start = process.hrtime.bigint();
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients?limit=10',
      headers: authHeaders(token, tenantId),
    });
    const ms = elapsed(start);

    expect(res.statusCode).toBe(200);
    expect(ms).toBeLessThan(T.LIST);
  });

  it(`GET /v1/training-plans responde em menos de ${T.LIST}ms`, async () => {
    const start = process.hrtime.bigint();
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans?limit=10',
      headers: authHeaders(token, tenantId),
    });
    const ms = elapsed(start);

    expect(res.statusCode).toBe(200);
    expect(ms).toBeLessThan(T.LIST);
  });

  it(`POST /v1/training-plans responde em menos de ${T.CREATE}ms`, async () => {
    const start = process.hrtime.bigint();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        name: `Perf Plan ${Date.now()}`,
        planJson: { exercises: [{ name: 'Agachamento', sets: 3, reps: '12' }] },
        startDate: new Date().toISOString().split('T')[0],
      },
    });
    const ms = elapsed(start);

    expect(res.statusCode).toBe(201);
    expect(ms).toBeLessThan(T.CREATE);
  });

  it(`GET /v1/training-executions responde em menos de ${T.LIST}ms`, async () => {
    const start = process.hrtime.bigint();
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-executions?limit=10',
      headers: authHeaders(token, tenantId),
    });
    const ms = elapsed(start);

    expect(res.statusCode).toBe(200);
    expect(ms).toBeLessThan(T.LIST);
  });
});

// ─── Carga: requisições concorrentes ─────────────────────────────────────────

describe('Performance: carga — requisições concorrentes', () => {
  it('5 requisições GET /health simultâneas completam em menos de 500ms', async () => {
    const start = process.hrtime.bigint();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => app.inject({ method: 'GET', url: '/health' })),
    );
    const ms = elapsed(start);

    results.forEach((r) => expect(r.statusCode).toBe(200));
    expect(ms).toBeLessThan(500);
  });

  it('5 requisições GET /v1/training-plans simultâneas completam sem falha', async () => {
    const start = process.hrtime.bigint();
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        app.inject({
          method: 'GET',
          url: '/v1/training-plans?limit=5',
          headers: authHeaders(token, tenantId),
        }),
      ),
    );
    const ms = elapsed(start);

    results.forEach((r) => expect(r.statusCode).toBe(200));
    expect(ms).toBeLessThan(T.CONCURRENT);
  });

  it('10 criações de plano concorrentes não geram erros 5xx', async () => {
    const today = new Date().toISOString().split('T')[0];
    const results = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        app.inject({
          method: 'POST',
          url: '/v1/training-plans',
          headers: authHeaders(token, tenantId),
          payload: {
            patientId,
            name: `Concurrent Plan ${Date.now()}-${i}`,
            planJson: { template: 'custom', days: [] },
            startDate: today,
          },
        }),
      ),
    );

    results.forEach((r) => {
      expect(r.statusCode).not.toBeGreaterThanOrEqual(500);
      expect([201, 400, 401, 403, 409, 422]).toContain(r.statusCode);
    });

    const successes = results.filter((r) => r.statusCode === 201);
    expect(successes.length).toBe(10); // Todos devem criar com sucesso
  }, 15000);
});

// ─── Estabilidade: múltiplas chamadas sequenciais ────────────────────────────

describe('Performance: estabilidade — múltiplas chamadas sequenciais', () => {
  it('20 chamadas GET /health sequenciais não degradam', async () => {
    const times: number[] = [];
    for (let i = 0; i < 20; i++) {
      const start = process.hrtime.bigint();
      await app.inject({ method: 'GET', url: '/health' });
      times.push(elapsed(start));
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);

    // Média abaixo de 50ms e máximo abaixo de 200ms
    expect(avg).toBeLessThan(50);
    expect(max).toBeLessThan(200);
  });

  it('resposta não cresce em tamanho de forma inesperada', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans?limit=10',
      headers: authHeaders(token, tenantId),
    });
    // Resposta JSON não deve exceder 100KB para uma lista de 10 itens
    expect(res.body.length).toBeLessThan(100 * 1024);
  });
});

// ─── Teste de estresse leve ───────────────────────────────────────────────────

describe('Performance: estresse leve — login + operação', () => {
  it('3 fluxos completos (login + listar + criar) em paralelo completam sem erros', async () => {
    const today = new Date().toISOString().split('T')[0];

    const runFlow = async (i: number) => {
      // Login
      const login = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: 'owner@demo.com', password: 'owner123' },
      });
      const t = login.json().token;
      const tid = login.json().user.tenantId;

      // Listar
      const list = await app.inject({
        method: 'GET',
        url: '/v1/training-plans?limit=5',
        headers: authHeaders(t, tid),
      });

      // Criar plano
      const create = await app.inject({
        method: 'POST',
        url: '/v1/training-plans',
        headers: authHeaders(t, tid),
        payload: { patientId, name: `Stress Plan ${i}-${Date.now()}`, planJson: {}, startDate: today },
      });

      return { login: login.statusCode, list: list.statusCode, create: create.statusCode };
    };

    const results = await Promise.all([runFlow(1), runFlow(2), runFlow(3)]);

    results.forEach(({ login, list, create }) => {
      expect(login).toBe(200);
      expect(list).toBe(200);
      expect(create).toBe(201);
    });
  }, 20000);
});
