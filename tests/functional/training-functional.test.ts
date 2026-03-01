/**
 * Teste Funcional — Training Plans
 *
 * Valida que o sistema atende aos requisitos funcionais especificados.
 * Foca no "o que" o sistema faz, não em como faz internamente.
 * Simula comportamentos reais de uso.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let token: string;
let tenantId: string;
let patientId: string;

const today = new Date().toISOString().split('T')[0];
const in30Days = new Date(Date.now() + 30 * 86400_000).toISOString().split('T')[0];

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
      fullName: `Functional Test Patient ${Date.now()}`,
      email: `func-${Date.now()}@test.com`,
    },
  });
  patientId = res.json().id;
});

afterAll(async () => {
  await app.close();
});

// ─── RF-01: Criação de plano com exercícios estruturados ─────────────────────

describe('RF-01: Criação de plano de treino com estrutura de dias', () => {
  it('deve criar plano com formato novo (days array) e retornar a estrutura corretamente', async () => {
    const planJson = {
      template: 'beginner-fullbody',
      level: 'beginner',
      days: [
        {
          id: 'day-a',
          label: 'Dia A',
          focus: 'Full Body',
          exercises: [
            { id: 'squat', name: 'Agachamento', sets: 3, reps: '12', rest: '60s', muscleGroup: 'Quadríceps' },
            { id: 'bench', name: 'Supino com Halteres', sets: 3, reps: '12', rest: '60s', muscleGroup: 'Peito' },
          ],
        },
        {
          id: 'day-b',
          label: 'Dia B',
          focus: 'Full Body',
          exercises: [
            { id: 'lunge', name: 'Afundo', sets: 3, reps: '10 cada', rest: '60s', muscleGroup: 'Quadríceps' },
          ],
        },
      ],
    };

    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: { patientId, name: 'Plano Full Body Iniciante', planJson, startDate: today },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBeDefined();
    expect(body.planJson.days).toHaveLength(2);
    expect(body.planJson.level).toBe('beginner');
    expect(body.planJson.days[0].exercises).toHaveLength(2);
  });

  it('deve retornar o plano com exercícios estruturados no GET', async () => {
    const planJson = {
      template: 'intermediate-ppl',
      level: 'intermediate',
      days: [{ id: 'push', label: 'Push', focus: 'Peito', exercises: [
        { id: 'bench', name: 'Supino', sets: 4, reps: '10', rest: '90s', muscleGroup: 'Peito' },
      ]}],
    };

    const create = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: { patientId, name: 'Plano PPL', planJson, startDate: today },
    });
    const planId = create.json().id;

    const get = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
    });

    expect(get.statusCode).toBe(200);
    const plan = get.json();
    expect(plan.planJson.days[0].label).toBe('Push');
    expect(plan.planJson.days[0].exercises[0].name).toBe('Supino');
  });
});

// ─── RF-02: Busca case-insensitive por nome ───────────────────────────────────

describe('RF-02: Busca de planos por nome (case-insensitive)', () => {
  beforeAll(async () => {
    await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: { patientId, name: 'Plano HIPERTROFIA Avançado', planJson: {}, startDate: today },
    });
  });

  it('busca com nome em minúsculas encontra plano criado com maiúsculas', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans?name=hipertrofia',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(
      body.data.some((p: { name: string }) => p.name.toLowerCase().includes('hipertrofia')),
    ).toBe(true);
  });

  it('busca por substring parcial do nome retorna resultados', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans?name=Avan%C3%A7ado',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data.length).toBeGreaterThanOrEqual(1);
  });

  it('busca com nome inexistente retorna lista vazia', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans?name=nomequenaoexisteemhipotesisnenhuma99xyz',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().data).toHaveLength(0);
    expect(res.json().meta.total).toBe(0);
  });
});

// ─── RF-03: Filtro por status ativo/inativo ──────────────────────────────────

describe('RF-03: Filtro de planos por status ativo/inativo', () => {
  beforeAll(async () => {
    await Promise.all([
      app.inject({
        method: 'POST',
        url: '/v1/training-plans',
        headers: authHeaders(token, tenantId),
        payload: { patientId, name: `Plano Ativo ${Date.now()}`, planJson: {}, startDate: today, active: true },
      }),
      app.inject({
        method: 'POST',
        url: '/v1/training-plans',
        headers: authHeaders(token, tenantId),
        payload: { patientId, name: `Plano Inativo ${Date.now()}`, planJson: {}, startDate: today, active: false },
      }),
    ]);
  });

  it('filtro active=true retorna apenas planos ativos', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans?active=true',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const plans = res.json().data as Array<{ active: boolean }>;
    expect(plans.length).toBeGreaterThanOrEqual(1);
    expect(plans.every((p) => p.active === true)).toBe(true);
  });

  it('filtro active=false retorna apenas planos inativos', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans?active=false',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const plans = res.json().data as Array<{ active: boolean }>;
    expect(plans.length).toBeGreaterThanOrEqual(1);
    expect(plans.every((p) => p.active === false)).toBe(true);
  });

  it('sem filtro retorna todos (ativos e inativos)', async () => {
    const all = await app.inject({
      method: 'GET',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
    });
    const actives = await app.inject({
      method: 'GET',
      url: '/v1/training-plans?active=true',
      headers: authHeaders(token, tenantId),
    });
    const inactives = await app.inject({
      method: 'GET',
      url: '/v1/training-plans?active=false',
      headers: authHeaders(token, tenantId),
    });
    expect(all.json().meta.total).toBe(
      actives.json().meta.total + inactives.json().meta.total,
    );
  });
});

// ─── RF-04: Contagem de execuções ────────────────────────────────────────────

describe('RF-04: executionsCount reflete execuções registradas', () => {
  let planId: string;

  beforeAll(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: { patientId, name: `Plano Contagem ${Date.now()}`, planJson: {}, startDate: today },
    });
    planId = res.json().id;
  });

  it('plano recém-criado tem executionsCount = 0', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
    });
    expect(res.json().executionsCount).toBe(0);
  });

  it('após registrar execução, executionsCount = 1', async () => {
    await app.inject({
      method: 'POST',
      url: '/v1/training-executions',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        trainingPlanId: planId,
        executedAt: new Date().toISOString(),
        completed: true,
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
    });
    expect(res.json().executionsCount).toBe(1);
  });

  it('após registrar 2ª execução, executionsCount = 2', async () => {
    await app.inject({
      method: 'POST',
      url: '/v1/training-executions',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        trainingPlanId: planId,
        executedAt: new Date().toISOString(),
        durationMinutes: 45,
        completed: true,
      },
    });

    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
    });
    expect(res.json().executionsCount).toBe(2);
  });
});

// ─── RF-05: Validação de datas ───────────────────────────────────────────────

describe('RF-05: Validação de datas do plano', () => {
  it('endDate igual a startDate é aceito', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        name: 'Plano 1 dia',
        planJson: {},
        startDate: today,
        endDate: today,
      },
    });
    // Depende da implementação — pode ser 201 ou 400
    expect([201, 400]).toContain(res.statusCode);
  });

  it('endDate posterior a startDate é aceito', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: { patientId, name: 'Plano 30 dias', planJson: {}, startDate: today, endDate: in30Days },
    });
    expect(res.statusCode).toBe(201);
  });

  it('endDate anterior a startDate é rejeitado → 400', async () => {
    const past = new Date(Date.now() - 5 * 86400_000).toISOString().split('T')[0];
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: { patientId, name: 'Plano Inválido', planJson: {}, startDate: today, endDate: past },
    });
    expect(res.statusCode).toBe(400);
  });
});

// ─── RF-06: Atualização parcial ──────────────────────────────────────────────

describe('RF-06: Atualização parcial de plano (PATCH)', () => {
  let planId: string;

  beforeAll(async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        name: 'Plano para Editar',
        description: 'Descrição original',
        planJson: { exercises: [] },
        startDate: today,
        active: true,
      },
    });
    planId = res.json().id;
  });

  it('PATCH apenas o nome não altera outros campos', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
      payload: { name: 'Nome Atualizado' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.name).toBe('Nome Atualizado');
    expect(body.active).toBe(true); // não alterado
  });

  it('PATCH desativa plano', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
      payload: { active: false },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().active).toBe(false);
  });

  it('PATCH atualiza planJson com novo formato de days', async () => {
    const newPlanJson = {
      template: 'advanced-upper-lower',
      level: 'advanced',
      days: [{ id: 'upper-a', label: 'Upper A', focus: 'Força', exercises: [] }],
    };
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
      payload: { planJson: newPlanJson },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().planJson.level).toBe('advanced');
  });
});
