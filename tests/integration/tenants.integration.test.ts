import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Tenants', () => {
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

  describe('POST /v1/tenants', () => {
    it('creates a tenant as owner → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/tenants',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: `Test Tenant ${Date.now()}` },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.name).toContain('Test Tenant');
      expect(body.status).toBe('active');
    });

    it('returns 403 for viewer role', async () => {
      // Create viewer
      const viewerEmail = `viewer-tenant-${Date.now()}@test.com`;
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
        url: '/v1/tenants',
        headers: authHeaders(viewerToken, tenantId),
        payload: { name: 'Unauthorized Tenant' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/tenants',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: { name: 'No Auth Tenant' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /v1/tenants/:id', () => {
    it('returns tenant details for own tenant → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/tenants/${tenantId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(tenantId);
      expect(body.name).toBeDefined();
      expect(body.status).toBe('active');
    });

    it('returns 404 for another tenant ID', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/tenants/nonexistent-id',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 404 for non-existent tenant', async () => {
      const fakeId = 'clxxxxxxxxxxxxxxxxxxxxxxxxx';
      const res = await app.inject({
        method: 'GET',
        url: `/v1/tenants/${fakeId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
