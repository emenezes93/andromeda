/**
 * Teste de Integração — Training Plans Formato Estruturado
 *
 * Verifica a integração entre os módulos após a nova funcionalidade
 * de criação de planos com templates e estrutura de dias (days[]).
 * Testa as interfaces entre: frontend wizard → API → banco de dados.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let token: string;
let tenantId: string;
let patientId: string;

const today = new Date().toISOString().split('T')[0];

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
      fullName: `Structured Plan Patient ${Date.now()}`,
      email: `structured-${Date.now()}@test.com`,
    },
  });
  patientId = res.json().id;
});

afterAll(async () => {
  await app.close();
});

// ─── Template Iniciante ───────────────────────────────────────────────────────

describe('Integration: Plano com template Iniciante (Full Body 2 dias)', () => {
  let planId: string;

  const beginnerPlanJson = {
    template: 'beginner-fullbody',
    level: 'beginner',
    days: [
      {
        id: 'beg-day-a',
        label: 'Dia A',
        focus: 'Full Body',
        exercises: [
          { id: 'beg-squat', name: 'Agachamento', sets: 3, reps: '12', rest: '60s', muscleGroup: 'Quadríceps / Glúteo' },
          { id: 'beg-db-bench', name: 'Supino com Halteres', sets: 3, reps: '12', rest: '60s', muscleGroup: 'Peito' },
          { id: 'beg-bent-row', name: 'Remada Curvada', sets: 3, reps: '12', rest: '60s', muscleGroup: 'Costas' },
          { id: 'beg-plank', name: 'Prancha', sets: 3, reps: '30s', rest: '45s', muscleGroup: 'Core', tip: 'Mantenha o abdômen contraído' },
        ],
      },
      {
        id: 'beg-day-b',
        label: 'Dia B',
        focus: 'Full Body',
        exercises: [
          { id: 'beg-lunge', name: 'Afundo', sets: 3, reps: '10 cada', rest: '60s', muscleGroup: 'Quadríceps / Glúteo' },
          { id: 'beg-pushup', name: 'Flexão de Braço', sets: 3, reps: '10–15', rest: '60s', muscleGroup: 'Peito' },
          { id: 'beg-lat-pull', name: 'Puxada na Máquina', sets: 3, reps: '12', rest: '60s', muscleGroup: 'Costas' },
        ],
      },
    ],
  };

  it('cria plano iniciante com estrutura de days → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        name: 'Full Body Iniciante — Template',
        description: '4–6 semanas para iniciantes',
        planJson: beginnerPlanJson,
        startDate: today,
        endDate: new Date(Date.now() + 42 * 86400_000).toISOString().split('T')[0],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    planId = body.id;
    expect(body.planJson.template).toBe('beginner-fullbody');
    expect(body.planJson.level).toBe('beginner');
    expect(body.planJson.days).toHaveLength(2);
    expect(body.planJson.days[0].exercises).toHaveLength(4);
    expect(body.planJson.days[1].exercises).toHaveLength(3);
  });

  it('retorna estrutura completa de exercícios no GET', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const plan = res.json();
    expect(plan.planJson.days[0].exercises[0].muscleGroup).toBe('Quadríceps / Glúteo');
    expect(plan.planJson.days[0].exercises[3].tip).toBe('Mantenha o abdômen contraído');
  });

  it('aparece na listagem com filtro por patientId', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans?patientId=${patientId}`,
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const ids = res.json().data.map((p: { id: string }) => p.id);
    expect(ids).toContain(planId);
  });
});

// ─── Template Intermediário ───────────────────────────────────────────────────

describe('Integration: Plano com template Intermediário (Push/Pull/Legs)', () => {
  let planId: string;

  const intermediatePlanJson = {
    template: 'intermediate-ppl',
    level: 'intermediate',
    days: [
      {
        id: 'int-push',
        label: 'Empurrar — Push',
        focus: 'Peito · Ombro · Tríceps',
        exercises: [
          { id: 'int-barbell-bench', name: 'Supino Reto Barra', sets: 4, reps: '10', rest: '90s', muscleGroup: 'Peito' },
          { id: 'int-ohp', name: 'Desenvolvimento Militar', sets: 3, reps: '10', rest: '90s', muscleGroup: 'Ombro' },
          { id: 'int-tri-rope', name: 'Tríceps Corda', sets: 3, reps: '12', rest: '60s', muscleGroup: 'Tríceps' },
        ],
      },
      {
        id: 'int-pull',
        label: 'Puxar — Pull',
        focus: 'Costas · Bíceps',
        exercises: [
          { id: 'int-pulldown', name: 'Puxada Frente Barra Larga', sets: 4, reps: '8', rest: '90s', muscleGroup: 'Costas' },
          { id: 'int-barbell-curl', name: 'Rosca Direta Barra', sets: 3, reps: '12', rest: '60s', muscleGroup: 'Bíceps' },
        ],
      },
      {
        id: 'int-legs',
        label: 'Pernas — Legs',
        focus: 'Quadríceps · Posterior',
        exercises: [
          { id: 'int-back-squat', name: 'Agachamento Livre', sets: 4, reps: '8', rest: '2min', muscleGroup: 'Quadríceps' },
          { id: 'int-leg-curl', name: 'Leg Curl Deitado', sets: 3, reps: '12', rest: '60s', muscleGroup: 'Posterior' },
        ],
      },
    ],
  };

  it('cria plano intermediário com 3 dias e exercícios distintos → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        name: 'PPL Intermediário — Template',
        planJson: intermediatePlanJson,
        startDate: today,
      },
    });
    expect(res.statusCode).toBe(201);
    planId = res.json().id;
    expect(res.json().planJson.days).toHaveLength(3);
    expect(res.json().planJson.days[0].label).toBe('Empurrar — Push');
    expect(res.json().planJson.days[2].label).toBe('Pernas — Legs');
  });

  it('PATCH substitui planJson por template avançado sem perder estrutura', async () => {
    const advancedUpdate = {
      template: 'advanced-upper-lower',
      level: 'advanced',
      days: [
        { id: 'adv-upper-a', label: 'Upper A — Força', focus: 'Peito · Costas', exercises: [
          { id: 'adv-bench', name: 'Supino Reto Barra', sets: 5, reps: '5', rest: '3min', muscleGroup: 'Peito' },
        ]},
      ],
    };

    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
      payload: { planJson: advancedUpdate },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().planJson.level).toBe('advanced');
    expect(res.json().planJson.days[0].exercises[0].sets).toBe(5);
  });
});

// ─── Template Avançado ────────────────────────────────────────────────────────

describe('Integration: Plano com template Avançado (Upper/Lower 4 dias)', () => {
  let planId: string;

  const advancedPlanJson = {
    template: 'advanced-upper-lower',
    level: 'advanced',
    days: [
      {
        id: 'adv-upper-a',
        label: 'Upper A — Força',
        focus: 'Peito · Costas · Ombro · Braços',
        exercises: [
          { id: 'adv-bench', name: 'Supino Reto Barra', sets: 5, reps: '5', rest: '3min', muscleGroup: 'Peito' },
          { id: 'adv-row', name: 'Remada Barra Pronada', sets: 5, reps: '5', rest: '3min', muscleGroup: 'Costas' },
          { id: 'adv-weighted-pullup', name: 'Barra Fixa com Lastro', sets: 4, reps: '6', rest: '2min', muscleGroup: 'Costas', tip: 'Use cinto de lastro' },
        ],
      },
      {
        id: 'adv-lower-a',
        label: 'Lower A — Força',
        focus: 'Quadríceps · Posterior',
        exercises: [
          { id: 'adv-squat', name: 'Agachamento Livre', sets: 5, reps: '5', rest: '3min', muscleGroup: 'Quadríceps' },
          { id: 'adv-rdl', name: 'Levantamento Terra Romeno', sets: 4, reps: '5', rest: '3min', muscleGroup: 'Posterior / Glúteo' },
        ],
      },
      {
        id: 'adv-upper-b',
        label: 'Upper B — Volume',
        focus: 'Peito · Costas · Ombro',
        exercises: [
          { id: 'adv-incline', name: 'Supino Inclinado Haltere', sets: 4, reps: '10', rest: '90s', muscleGroup: 'Peito' },
          { id: 'adv-face-pull', name: 'Face Pull', sets: 4, reps: '15', rest: '60s', muscleGroup: 'Ombro Posterior' },
        ],
      },
      {
        id: 'adv-lower-b',
        label: 'Lower B — Volume',
        focus: 'Quadríceps · Posterior · Glúteo',
        exercises: [
          { id: 'adv-hack', name: 'Hack Squat', sets: 4, reps: '12', rest: '90s', muscleGroup: 'Quadríceps' },
          { id: 'adv-hip-thrust', name: 'Hip Thrust', sets: 4, reps: '12', rest: '75s', muscleGroup: 'Glúteo' },
        ],
      },
    ],
  };

  it('cria plano avançado com 4 dias → 201', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        name: 'Upper/Lower Avançado — Template',
        planJson: advancedPlanJson,
        startDate: today,
      },
    });
    expect(res.statusCode).toBe(201);
    planId = res.json().id;
    expect(res.json().planJson.days).toHaveLength(4);
    expect(res.json().planJson.days[0].exercises[2].tip).toBe('Use cinto de lastro');
  });

  it('integridade dos dados: exercícios avançados com rest "3min" são preservados', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
    });
    const plan = res.json();
    expect(plan.planJson.days[0].exercises[0].rest).toBe('3min');
    expect(plan.planJson.days[0].exercises[0].sets).toBe(5);
  });

  it('execução do plano avançado é registrada corretamente', async () => {
    const exec = await app.inject({
      method: 'POST',
      url: '/v1/training-executions',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        trainingPlanId: planId,
        executedAt: new Date().toISOString(),
        durationMinutes: 90,
        notes: 'Upper A — Semana 1. Foco em técnica.',
        completed: true,
      },
    });
    expect(exec.statusCode).toBe(201);
    expect(exec.json().durationMinutes).toBe(90);

    // Verifica que executionsCount foi atualizado
    const plan = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
    });
    expect(plan.json().executionsCount).toBeGreaterThanOrEqual(1);
  });
});

// ─── Plano do zero (custom) ───────────────────────────────────────────────────

describe('Integration: Plano do zero (custom)', () => {
  it('cria plano personalizado com exercícios livres → 201', async () => {
    const customPlanJson = {
      template: 'custom',
      level: 'custom',
      days: [
        {
          id: `day-${Date.now()}`,
          label: 'Meu Dia 1',
          focus: 'Circuito',
          exercises: [
            { id: `ex-${Date.now()}-1`, name: 'Burpee', sets: 3, reps: '15', rest: '45s', muscleGroup: 'Cardio' },
            { id: `ex-${Date.now()}-2`, name: 'Corda Naval', sets: 3, reps: '30s', rest: '60s', muscleGroup: 'Full Body' },
          ],
        },
      ],
    };

    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: { patientId, name: 'Treino Personalizado', planJson: customPlanJson, startDate: today },
    });

    expect(res.statusCode).toBe(201);
    expect(res.json().planJson.template).toBe('custom');
    expect(res.json().planJson.days[0].exercises[0].name).toBe('Burpee');
  });

  it('plano custom persiste exercícios adicionados pelo usuário', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(token, tenantId),
      payload: {
        patientId,
        name: 'Plano Custom Persistência',
        planJson: {
          template: 'custom',
          level: 'custom',
          days: [{
            id: 'd1',
            label: 'Dia Único',
            focus: 'Misto',
            exercises: [
              { id: 'e1', name: 'Exercício Personalizado A', sets: 4, reps: '10', rest: '75s', muscleGroup: 'Braços' },
            ],
          }],
        },
        startDate: today,
      },
    });

    const planId = create.json().id;
    const get = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(token, tenantId),
    });

    expect(get.json().planJson.days[0].exercises[0].name).toBe('Exercício Personalizado A');
    expect(get.json().planJson.days[0].exercises[0].muscleGroup).toBe('Braços');
  });
});
