import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Patients', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let patientId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /v1/patients ────────────────────────────────────────────────────

  describe('POST /v1/patients', () => {
    it('creates patient and returns 201 with id', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          fullName: `Patient Integration ${Date.now()}`,
          email: `patient-${Date.now()}@test.com`,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.fullName).toContain('Patient Integration');
      patientId = body.id;
    });

    it('creates patient with all optional fields → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          fullName: 'Full Fields Patient',
          email: `full-${Date.now()}@test.com`,
          birthDate: '1990-05-15',
          gender: 'M',
          phone: '+5511999999999',
          profession: 'Engenheiro',
          mainGoal: 'Emagrecer',
          mainComplaint: 'Dor nas costas',
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.gender).toBe('M');
      expect(body.profession).toBe('Engenheiro');
    });

    it('returns 400/422 for fullName too short', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: authHeaders(ownerToken, tenantId),
        payload: { fullName: 'A' },
      });
      expect([400, 422]).toContain(res.statusCode);
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: { fullName: 'No Auth', email: 'noauth@test.com' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 403 for viewer role', async () => {
      const viewerEmail = `viewer-pat-${Date.now()}@test.com`;
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
        url: '/v1/patients',
        headers: authHeaders(viewerToken, tenantId),
        payload: { fullName: 'Viewer Patient', email: `vp-${Date.now()}@test.com` },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /v1/patients ─────────────────────────────────────────────────────

  describe('GET /v1/patients', () => {
    it('returns list with data and meta', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/patients',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBeDefined();
      expect(body.meta.total).toBeDefined();
      expect(body.meta.totalPages).toBeDefined();
    });

    it('accepts page and limit query', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/patients?page=1&limit=5',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.length).toBeLessThanOrEqual(5);
      expect(body.meta.limit).toBe(5);
    });

    it('search filter returns matching patients', async () => {
      // Create a uniquely named patient
      const uniqueName = `SearchablePatient_${Date.now()}`;
      await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: authHeaders(ownerToken, tenantId),
        payload: { fullName: uniqueName },
      });

      const res = await app.inject({
        method: 'GET',
        url: `/v1/patients?search=SearchablePatient`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.length).toBeGreaterThanOrEqual(1);
      expect(body.data.some((p: { fullName: string }) => p.fullName.includes('SearchablePatient'))).toBe(true);
    });
  });

  // ── GET /v1/patients/:id ─────────────────────────────────────────────────

  describe('GET /v1/patients/:id', () => {
    it('returns patient by id when exists', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/patients/${patientId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(patientId);
      expect(body.fullName).toBeDefined();
    });

    it('returns 404 for non-existent id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/patients/nonexistent-id-12345',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── PATCH /v1/patients/:id ───────────────────────────────────────────────

  describe('PATCH /v1/patients/:id', () => {
    it('updates patient and returns 200', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/patients/${patientId}`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { fullName: 'Patient Updated Name', phone: '+5511999999999' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.fullName).toBe('Patient Updated Name');
      expect(body.phone).toBe('+5511999999999');
    });

    it('returns 404 for non-existent patient', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/patients/nonexistent-id',
        headers: authHeaders(ownerToken, tenantId),
        payload: { fullName: 'X Updated' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── GET /v1/patients/:id/timeline ────────────────────────────────────────

  describe('GET /v1/patients/:id/timeline', () => {
    it('returns timeline for existing patient → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/patients/${patientId}/timeline`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      // Timeline can be empty or populated
      expect(body).toBeDefined();
    });

    it('accepts limit query param', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/patients/${patientId}/timeline?limit=5`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns 404 for non-existent patient', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/patients/nonexistent-id/timeline',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── DELETE /v1/patients/:id ──────────────────────────────────────────────

  describe('DELETE /v1/patients/:id', () => {
    it('soft-deletes patient as admin → 204', async () => {
      // Create a patient to delete
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: authHeaders(ownerToken, tenantId),
        payload: { fullName: 'Patient To Delete', email: `delete-${Date.now()}@test.com` },
      });
      const idToDelete = createRes.json().id;

      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/v1/patients/${idToDelete}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(deleteRes.statusCode).toBe(204);
    });

    it('returns 404 after deletion', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: authHeaders(ownerToken, tenantId),
        payload: { fullName: 'Delete Then Get', email: `dtg-${Date.now()}@test.com` },
      });
      const id = createRes.json().id;

      await app.inject({
        method: 'DELETE',
        url: `/v1/patients/${id}`,
        headers: authHeaders(ownerToken, tenantId),
      });

      const getRes = await app.inject({
        method: 'GET',
        url: `/v1/patients/${id}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(getRes.statusCode).toBe(404);
    });

    it('returns 404 for non-existent patient', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/v1/patients/nonexistent-id',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
