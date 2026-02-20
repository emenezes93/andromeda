import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
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

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: { fullName: 'No Auth', email: 'noauth@test.com' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

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
      expect(body.meta).toBeDefined();
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
  });

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
  });
});
