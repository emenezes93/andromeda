import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

/**
 * Integration tests for:
 *   - GET/POST/PATCH/DELETE /v1/training-plans
 *   - POST/GET/DELETE        /v1/training-executions
 *   - POST/GET/PATCH/DELETE  /v1/progress-photos
 */
describe('Integration: Training Plans', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let patientId: string;
  let planId: string;

  const startDate = new Date().toISOString().split('T')[0];
  const endDate = new Date(Date.now() + 30 * 86400_000).toISOString().split('T')[0];

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;

    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        fullName: `Training Test Patient ${Date.now()}`,
        email: `training-patient-${Date.now()}@test.com`,
      },
    });
    patientId = res.json().id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /v1/training-plans ────────────────────────────────────────────

  describe('POST /v1/training-plans', () => {
    it('creates a plan with required fields → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/training-plans',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          name: 'Plano Hipertrofia Fase 1',
          planJson: { exercises: [{ name: 'Agachamento', sets: 3, reps: '12' }] },
          startDate,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.patientId).toBe(patientId);
      expect(body.name).toBe('Plano Hipertrofia Fase 1');
      planId = body.id;
    });

    it('creates a plan with all optional fields → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/training-plans',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          name: 'Plano Cardio',
          description: 'Foco em resistência aeróbica',
          planJson: { exercises: [{ name: 'Corrida', duration: '30min' }] },
          startDate,
          endDate,
          active: false,
        },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().id).toBeDefined();
    });

    it('rejects non-existent patient → 404', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/training-plans',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId: 'non-existent-id',
          name: 'Plano X',
          planJson: {},
          startDate,
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('rejects endDate before startDate → 400', async () => {
      const pastDate = new Date(Date.now() - 5 * 86400_000).toISOString().split('T')[0];
      const res = await app.inject({
        method: 'POST',
        url: '/v1/training-plans',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          name: 'Plano Inválido',
          planJson: {},
          startDate,
          endDate: pastDate,
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects unauthenticated request → 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/training-plans',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: { patientId, name: 'X', planJson: {}, startDate },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /v1/training-plans ─────────────────────────────────────────────

  describe('GET /v1/training-plans', () => {
    it('lists plans with pagination → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/training-plans',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(body.meta.total).toBeGreaterThanOrEqual(1);
    });

    it('filters by patientId → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/training-plans?patientId=${patientId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.every((p: { patientId: string }) => p.patientId === patientId)).toBe(true);
    });

    it('filters by active status → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/training-plans?active=false',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.every((p: { active: boolean }) => p.active === false)).toBe(true);
    });

    it('filters by name (contains, case-insensitive) → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/training-plans?name=hipertrofia',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(
        body.data.every((p: { name: string }) => p.name.toLowerCase().includes('hipertrofia')),
      ).toBe(true);
    });
  });

  // ── GET /v1/training-plans/:id ─────────────────────────────────────────

  describe('GET /v1/training-plans/:id', () => {
    it('returns plan by id → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/training-plans/${planId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(planId);
      expect(body.patientName).toBeDefined();
      expect(body.executionsCount).toBeDefined();
    });

    it('returns 404 for non-existent plan', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/training-plans/non-existent-id',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── PATCH /v1/training-plans/:id ──────────────────────────────────────

  describe('PATCH /v1/training-plans/:id', () => {
    it('updates name and active → 200', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/training-plans/${planId}`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: 'Plano Hipertrofia Fase 1 — Atualizado', active: false },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.name).toBe('Plano Hipertrofia Fase 1 — Atualizado');
      expect(body.active).toBe(false);
    });

    it('returns 404 for non-existent plan', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/training-plans/non-existent-id',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: 'X' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── DELETE /v1/training-plans/:id ─────────────────────────────────────

  describe('DELETE /v1/training-plans/:id', () => {
    it('soft-deletes a plan → 204', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/v1/training-plans',
        headers: authHeaders(ownerToken, tenantId),
        payload: { patientId, name: 'Plano para deletar', planJson: {}, startDate },
      });
      const id = create.json().id;

      const del = await app.inject({
        method: 'DELETE',
        url: `/v1/training-plans/${id}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(del.statusCode).toBe(204);

      const get = await app.inject({
        method: 'GET',
        url: `/v1/training-plans/${id}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(get.statusCode).toBe(404);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Integration: Training Executions', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let patientId: string;
  let planId: string;
  let executionId: string;

  const startDate = new Date().toISOString().split('T')[0];

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;

    const patient = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        fullName: `Execution Test Patient ${Date.now()}`,
        email: `exec-patient-${Date.now()}@test.com`,
      },
    });
    patientId = patient.json().id;

    const plan = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: { patientId, name: 'Plano Execução', planJson: {}, startDate },
    });
    planId = plan.json().id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /v1/training-executions ──────────────────────────────────────

  describe('POST /v1/training-executions', () => {
    it('creates execution with plan → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/training-executions',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          trainingPlanId: planId,
          executedAt: new Date().toISOString(),
          durationMinutes: 60,
          notes: 'Treino intenso',
          completed: true,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.patientId).toBe(patientId);
      executionId = body.id;
    });

    it('creates execution without plan → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/training-executions',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          executedAt: new Date().toISOString(),
          completed: false,
        },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().id).toBeDefined();
    });

    it('rejects invalid trainingPlanId → 404', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/training-executions',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          trainingPlanId: 'non-existent-plan',
          executedAt: new Date().toISOString(),
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('rejects non-existent patient → 404', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/training-executions',
        headers: authHeaders(ownerToken, tenantId),
        payload: { patientId: 'ghost', executedAt: new Date().toISOString() },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── GET /v1/training-executions ───────────────────────────────────────

  describe('GET /v1/training-executions', () => {
    it('lists executions → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/training-executions',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json().data)).toBe(true);
    });

    it('filters by patientId → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/training-executions?patientId=${patientId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.every((e: { patientId: string }) => e.patientId === patientId)).toBe(true);
    });

    it('filters by trainingPlanId → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/training-executions?trainingPlanId=${planId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(
        body.data.every((e: { trainingPlanId: string }) => e.trainingPlanId === planId),
      ).toBe(true);
    });
  });

  // ── GET /v1/training-executions/:id ───────────────────────────────────

  describe('GET /v1/training-executions/:id', () => {
    it('returns execution by id → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/training-executions/${executionId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().id).toBe(executionId);
    });

    it('returns 404 for non-existent execution', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/training-executions/ghost-id',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── DELETE /v1/training-executions/:id ────────────────────────────────

  describe('DELETE /v1/training-executions/:id', () => {
    it('deletes execution → 204', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/v1/training-executions',
        headers: authHeaders(ownerToken, tenantId),
        payload: { patientId, executedAt: new Date().toISOString(), completed: true },
      });
      const id = create.json().id;

      const del = await app.inject({
        method: 'DELETE',
        url: `/v1/training-executions/${id}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(del.statusCode).toBe(204);

      const get = await app.inject({
        method: 'GET',
        url: `/v1/training-executions/${id}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(get.statusCode).toBe(404);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe('Integration: Progress Photos', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let patientId: string;
  let photoId: string;

  const takenAt = new Date().toISOString();

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;

    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        fullName: `Photo Test Patient ${Date.now()}`,
        email: `photo-patient-${Date.now()}@test.com`,
      },
    });
    patientId = res.json().id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /v1/progress-photos ───────────────────────────────────────────

  describe('POST /v1/progress-photos', () => {
    it('creates photo with required fields → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/progress-photos',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          imageUrl: 'https://example.com/photo1.jpg',
          takenAt,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.patientId).toBe(patientId);
      expect(body.imageUrl).toBe('https://example.com/photo1.jpg');
      photoId = body.id;
    });

    it('creates photo with notes → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/progress-photos',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          imageUrl: 'https://example.com/photo2.jpg',
          takenAt,
          notes: 'Vista frontal — semana 4',
        },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().id).toBeDefined();
    });

    it('rejects non-existent patient → 404', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/progress-photos',
        headers: authHeaders(ownerToken, tenantId),
        payload: { patientId: 'ghost', imageUrl: 'https://x.com/p.jpg', takenAt },
      });
      expect(res.statusCode).toBe(404);
    });

    it('rejects unauthenticated request → 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/progress-photos',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: { patientId, imageUrl: 'https://x.com/p.jpg', takenAt },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /v1/progress-photos ────────────────────────────────────────────

  describe('GET /v1/progress-photos', () => {
    it('lists photos → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/progress-photos',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json().data)).toBe(true);
    });

    it('filters by patientId → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/progress-photos?patientId=${patientId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(2);
      expect(body.data.every((p: { patientId: string }) => p.patientId === patientId)).toBe(true);
    });
  });

  // ── GET /v1/progress-photos/:id ────────────────────────────────────────

  describe('GET /v1/progress-photos/:id', () => {
    it('returns photo by id → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/progress-photos/${photoId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(photoId);
      expect(body.imageUrl).toBeDefined();
    });

    it('returns 404 for non-existent photo', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/progress-photos/ghost-id',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── PATCH /v1/progress-photos/:id ─────────────────────────────────────

  describe('PATCH /v1/progress-photos/:id', () => {
    it('updates notes → 200', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/progress-photos/${photoId}`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { notes: 'Vista atualizada — frente' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().notes).toBe('Vista atualizada — frente');
    });

    it('returns 404 for non-existent photo', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/progress-photos/ghost-id',
        headers: authHeaders(ownerToken, tenantId),
        payload: { notes: 'x' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── DELETE /v1/progress-photos/:id ────────────────────────────────────

  describe('DELETE /v1/progress-photos/:id', () => {
    it('deletes photo → 204', async () => {
      const create = await app.inject({
        method: 'POST',
        url: '/v1/progress-photos',
        headers: authHeaders(ownerToken, tenantId),
        payload: { patientId, imageUrl: 'https://example.com/del.jpg', takenAt },
      });
      const id = create.json().id;

      const del = await app.inject({
        method: 'DELETE',
        url: `/v1/progress-photos/${id}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(del.statusCode).toBe(204);

      const get = await app.inject({
        method: 'GET',
        url: `/v1/progress-photos/${id}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(get.statusCode).toBe(404);
    });
  });
});
