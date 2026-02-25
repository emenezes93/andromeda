import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Goals', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let patientId: string;
  let goalId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;

    // Create a patient to associate goals with
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        fullName: `Goals Test Patient ${Date.now()}`,
        email: `goals-patient-${Date.now()}@test.com`,
      },
    });
    patientId = res.json().id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /v1/goals ──────────────────────────────────────────────────────

  describe('POST /v1/goals', () => {
    it('creates a goal with valid payload → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          type: 'weight_loss',
          title: 'Perder 5 kg',
          targetValue: 80,
          unit: 'kg',
          startDate: new Date().toISOString(),
          targetDate: new Date(Date.now() + 90 * 86400_000).toISOString(),
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.patientId).toBe(patientId);
      expect(body.type).toBe('weight_loss');
      expect(body.title).toBe('Perder 5 kg');
      goalId = body.id;
    });

    it('creates a goal with all optional fields → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          type: 'muscle_gain',
          title: 'Ganhar massa',
          targetValue: 75,
          unit: 'kg',
          startDate: new Date().toISOString(),
          targetDate: new Date(Date.now() + 60 * 86400_000).toISOString(),
          description: 'Foco em hipertrofia',
          currentValue: 68,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.description).toBe('Foco em hipertrofia');
    });

    it('returns 404 for non-existent patientId', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId: 'nonexistent-patient-id',
          type: 'health',
          title: 'Goal',
          targetValue: 10,
          unit: 'reps',
          startDate: new Date().toISOString(),
          targetDate: new Date(Date.now() + 30 * 86400_000).toISOString(),
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: {
          patientId,
          type: 'health',
          title: 'No auth goal',
          targetValue: 1,
          unit: 'x',
          startDate: new Date().toISOString(),
          targetDate: new Date(Date.now() + 10 * 86400_000).toISOString(),
        },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 403 for viewer role', async () => {
      const viewerEmail = `viewer-goals-${Date.now()}@test.com`;
      await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email: viewerEmail, password: STRONG_PASSWORD, role: 'viewer' },
      });
      const loginRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: viewerEmail, password: STRONG_PASSWORD },
      });
      if (loginRes.statusCode !== 200) return;
      const viewerToken = loginRes.json().token;

      const res = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: authHeaders(viewerToken, tenantId),
        payload: {
          patientId,
          type: 'health',
          title: 'Viewer goal',
          targetValue: 1,
          unit: 'x',
          startDate: new Date().toISOString(),
          targetDate: new Date(Date.now() + 10 * 86400_000).toISOString(),
        },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /v1/goals ───────────────────────────────────────────────────────

  describe('GET /v1/goals', () => {
    it('returns paginated list → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/goals',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(typeof body.meta.total).toBe('number');
    });

    it('filters by patientId', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/goals?patientId=${patientId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      for (const goal of body.data) {
        expect(goal.patientId).toBe(patientId);
      }
    });

    it('filters by type', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/goals?type=weight_loss',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      for (const goal of body.data) {
        expect(goal.type).toBe('weight_loss');
      }
    });

    it('filters by achieved=false', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/goals?achieved=false',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toBeDefined();
    });

    it('respects page and limit', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/goals?page=1&limit=1',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.length).toBeLessThanOrEqual(1);
      expect(res.json().meta.limit).toBe(1);
    });
  });

  // ── GET /v1/goals/:id ───────────────────────────────────────────────────

  describe('GET /v1/goals/:id', () => {
    it('returns goal by id → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/goals/${goalId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(goalId);
      expect(body.title).toBeDefined();
      expect(body.type).toBeDefined();
    });

    it('returns 404 for non-existent goal', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/goals/nonexistent-goal-id',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── PATCH /v1/goals/:id ─────────────────────────────────────────────────

  describe('PATCH /v1/goals/:id', () => {
    it('updates title and currentValue → 200', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/goals/${goalId}`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { title: 'Meta atualizada', currentValue: 83 },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.title).toBe('Meta atualizada');
      expect(body.currentValue).toBe(83);
    });

    it('marks goal as achieved by setting achievedAt → 200', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/goals/${goalId}`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { achievedAt: new Date().toISOString() },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().achievedAt).toBeDefined();
    });

    it('returns 404 for non-existent goal', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/goals/nonexistent-goal-id',
        headers: authHeaders(ownerToken, tenantId),
        payload: { title: 'X' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── DELETE /v1/goals/:id ────────────────────────────────────────────────

  describe('DELETE /v1/goals/:id', () => {
    it('soft-deletes goal → 204', async () => {
      // Create a fresh goal to delete
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          type: 'other',
          title: 'Para deletar',
          targetValue: 1,
          unit: 'x',
          startDate: new Date().toISOString(),
          targetDate: new Date(Date.now() + 10 * 86400_000).toISOString(),
        },
      });
      const idToDelete = createRes.json().id;

      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/v1/goals/${idToDelete}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(deleteRes.statusCode).toBe(204);
    });

    it('returns 404 after deletion', async () => {
      // Create and delete
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          type: 'performance',
          title: 'Deletar e buscar',
          targetValue: 5,
          unit: 'km',
          startDate: new Date().toISOString(),
          targetDate: new Date(Date.now() + 30 * 86400_000).toISOString(),
        },
      });
      const id = createRes.json().id;
      await app.inject({
        method: 'DELETE',
        url: `/v1/goals/${id}`,
        headers: authHeaders(ownerToken, tenantId),
      });

      const getRes = await app.inject({
        method: 'GET',
        url: `/v1/goals/${id}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(getRes.statusCode).toBe(404);
    });

    it('returns 404 for non-existent goal', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/v1/goals/nonexistent-id',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
