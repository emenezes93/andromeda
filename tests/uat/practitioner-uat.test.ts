/**
 * Teste de Aceitação do Usuário (UAT) — Fluxo do Personal Trainer
 *
 * Simula cenários reais de uso por um personal trainer (practitioner)
 * para confirmar que o software atende às necessidades do usuário final.
 * Narrativa: "Como personal trainer, quero criar e gerenciar planos de treino
 * para meus pacientes de forma simples e eficiente."
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

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

// ─── UAT-01: Personal cria e gerencia plano de treino ────────────────────────

describe('UAT-01: Jornada do Personal Trainer', () => {
  let practitionerToken: string;
  let patientId: string;
  let planId: string;
  let executionId: string;

  it('[Setup] Personal trainer é cadastrado no sistema pelo owner', async () => {
    const email = `personal-${Date.now()}@academia.com`;
    const res = await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(ownerToken, tenantId),
      payload: { email, password: STRONG_PASSWORD, role: 'practitioner' },
    });
    expect([200, 201]).toContain(res.statusCode);

    // Personal faz login
    const login = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email, password: STRONG_PASSWORD },
    });
    expect(login.statusCode).toBe(200);
    practitionerToken = login.json().token;
    expect(practitionerToken).toBeDefined();
  });

  it('[UAT-01a] Personal cadastra um novo paciente', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(practitionerToken, tenantId),
      payload: {
        fullName: 'João Silva — Aluno',
        email: `joao.silva.${Date.now()}@gmail.com`,
        birthDate: '1990-05-15',
        gender: 'M',
      },
    });
    expect(res.statusCode).toBe(201);
    patientId = res.json().id;
    expect(patientId).toBeDefined();
  });

  it('[UAT-01b] Personal cria plano de treino para o paciente (template iniciante)', async () => {
    const planJson = {
      template: 'beginner-fullbody',
      level: 'beginner',
      days: [
        {
          id: 'day-a',
          label: 'Dia A',
          focus: 'Full Body',
          exercises: [
            { id: 'squat', name: 'Agachamento', sets: 3, reps: '12', rest: '60s', muscleGroup: 'Quadríceps / Glúteo' },
            { id: 'db-bench', name: 'Supino com Halteres', sets: 3, reps: '12', rest: '60s', muscleGroup: 'Peito' },
            { id: 'plank', name: 'Prancha', sets: 3, reps: '30s', rest: '45s', muscleGroup: 'Core' },
          ],
        },
        {
          id: 'day-b',
          label: 'Dia B',
          focus: 'Full Body',
          exercises: [
            { id: 'pushup', name: 'Flexão de Braço', sets: 3, reps: '10', rest: '60s', muscleGroup: 'Peito' },
            { id: 'lunge', name: 'Afundo', sets: 3, reps: '10 cada', rest: '60s', muscleGroup: 'Quadríceps' },
          ],
        },
      ],
    };

    const startDate = new Date().toISOString().split('T')[0];
    const endDate = new Date(Date.now() + 42 * 86400_000).toISOString().split('T')[0]; // 6 semanas

    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(practitionerToken, tenantId),
      payload: {
        patientId,
        name: 'Full Body Iniciante — João Silva',
        description: 'Plano de 6 semanas para iniciante. 3× por semana.',
        planJson,
        startDate,
        endDate,
        active: true,
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    planId = body.id;
    expect(body.planJson.days).toHaveLength(2);
    expect(body.planJson.level).toBe('beginner');
    expect(body.name).toBe('Full Body Iniciante — João Silva');
  });

  it('[UAT-01c] Personal visualiza o plano criado', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.patientName).toBeDefined();
    expect(body.executionsCount).toBe(0);
    expect(body.planJson.days[0].exercises).toHaveLength(3);
  });

  it('[UAT-01d] Paciente treina: personal registra execução', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-executions',
      headers: authHeaders(practitionerToken, tenantId),
      payload: {
        patientId,
        trainingPlanId: planId,
        executedAt: new Date().toISOString(),
        durationMinutes: 45,
        notes: 'Primeiro treino — ritmo conservador',
        completed: true,
      },
    });
    expect(res.statusCode).toBe(201);
    executionId = res.json().id;
    expect(executionId).toBeDefined();
    expect(res.json().completed).toBe(true);
  });

  it('[UAT-01e] Personal verifica que executionsCount aumentou', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.json().executionsCount).toBe(1);
  });

  it('[UAT-01f] Personal atualiza o plano (progressão — aumenta séries)', async () => {
    const updatedPlanJson = {
      template: 'beginner-fullbody',
      level: 'beginner',
      days: [
        {
          id: 'day-a',
          label: 'Dia A',
          focus: 'Full Body',
          exercises: [
            { id: 'squat', name: 'Agachamento', sets: 4, reps: '12', rest: '60s', muscleGroup: 'Quadríceps / Glúteo' },
            { id: 'db-bench', name: 'Supino com Halteres', sets: 4, reps: '12', rest: '60s', muscleGroup: 'Peito' },
          ],
        },
      ],
    };

    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(practitionerToken, tenantId),
      payload: {
        name: 'Full Body Iniciante — João Silva (Semana 3)',
        planJson: updatedPlanJson,
      },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().planJson.days[0].exercises[0].sets).toBe(4);
  });

  it('[UAT-01g] Personal lista todos os planos do paciente', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans?patientId=${patientId}`,
      headers: authHeaders(practitionerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.every((p: { patientId: string }) => p.patientId === patientId)).toBe(true);
  });
});

// ─── UAT-02: Viewer pode visualizar mas não modificar ────────────────────────

describe('UAT-02: Perfil Viewer — apenas leitura', () => {
  let viewerToken: string;
  let patientId: string;
  let planId: string;

  beforeAll(async () => {
    const email = `viewer-${Date.now()}@academia.com`;
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

    // Cria dados pelo owner
    const patient = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
      payload: { fullName: `UAT Viewer Patient ${Date.now()}` },
    });
    patientId = patient.json().id;

    const plan = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: { patientId, name: 'Plano para Viewer', planJson: {}, startDate: new Date().toISOString().split('T')[0] },
    });
    planId = plan.json().id;
  });

  it('viewer pode listar planos de treino → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans',
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
  });

  it('viewer pode ver detalhes de um plano → 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
  });

  it('viewer NÃO pode criar plano de treino → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(viewerToken, tenantId),
      payload: { patientId, name: 'Tentativa Viewer', planJson: {}, startDate: new Date().toISOString().split('T')[0] },
    });
    expect(res.statusCode).toBe(403);
  });

  it('viewer NÃO pode editar plano de treino → 403', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(viewerToken, tenantId),
      payload: { name: 'Tentativa de Edição' },
    });
    expect(res.statusCode).toBe(403);
  });

  it('viewer NÃO pode deletar plano de treino → 403', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(403);
  });

  it('viewer NÃO pode criar paciente → 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(viewerToken, tenantId),
      payload: { fullName: 'Tentativa Viewer' },
    });
    expect(res.statusCode).toBe(403);
  });
});

// ─── UAT-03: Owner gerencia o plano completo ─────────────────────────────────

describe('UAT-03: Jornada do Owner — visão gerencial', () => {
  it('owner pode listar todos os planos de treino do tenant', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().meta.total).toBeGreaterThanOrEqual(1);
  });

  it('owner pode ver todas as execuções de treino', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/training-executions',
      headers: authHeaders(ownerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.json().data)).toBe(true);
  });

  it('owner pode desativar um plano existente', async () => {
    // Cria e desativa
    const patient = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
      payload: { fullName: `Owner UAT Patient ${Date.now()}` },
    });
    const plan = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        patientId: patient.json().id,
        name: 'Plano para desativar',
        planJson: {},
        startDate: new Date().toISOString().split('T')[0],
      },
    });
    const planId = plan.json().id;

    const deactivate = await app.inject({
      method: 'PATCH',
      url: `/v1/training-plans/${planId}`,
      headers: authHeaders(ownerToken, tenantId),
      payload: { active: false },
    });
    expect(deactivate.statusCode).toBe(200);
    expect(deactivate.json().active).toBe(false);
  });
});
