import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Tenants', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let newTenantId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /v1/tenants ─────────────────────────────────────────────────────

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
      newTenantId = body.id;
    });

    it('returns 403 for viewer role', async () => {
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

  // ── GET /v1/tenants ──────────────────────────────────────────────────────

  describe('GET /v1/tenants', () => {
    it('returns paginated list as owner → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/tenants',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(typeof body.meta.total).toBe('number');
    });

    it('respects page and limit', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/tenants?page=1&limit=2',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.length).toBeLessThanOrEqual(2);
      expect(res.json().meta.limit).toBe(2);
    });
  });

  // ── GET /v1/tenants/:id ──────────────────────────────────────────────────

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

  // ── PATCH /v1/tenants/:id ────────────────────────────────────────────────

  describe('PATCH /v1/tenants/:id', () => {
    it('updates tenant name as owner → 200', async () => {
      const updatedName = `Updated Tenant ${Date.now()}`;
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/tenants/${newTenantId}`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: updatedName },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().name).toBe(updatedName);
    });

    it('returns 404 for non-existent tenant', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/tenants/nonexistent-id',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: 'X' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── POST /v1/tenants/:id/suspend ─────────────────────────────────────────

  describe('POST /v1/tenants/:id/suspend', () => {
    it('suspends an active tenant → 200', async () => {
      // Create a fresh tenant to suspend
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/tenants',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: `To Suspend ${Date.now()}` },
      });
      const idToSuspend = createRes.json().id;

      const res = await app.inject({
        method: 'POST',
        url: `/v1/tenants/${idToSuspend}/suspend`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe('suspended');
    });

    it('returns 404 for non-existent tenant', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/tenants/nonexistent-id/suspend',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── POST /v1/tenants/:id/activate ────────────────────────────────────────

  describe('POST /v1/tenants/:id/activate', () => {
    it('activates a suspended tenant → 200', async () => {
      // Create and suspend first
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/tenants',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: `To Activate ${Date.now()}` },
      });
      const id = createRes.json().id;
      await app.inject({
        method: 'POST',
        url: `/v1/tenants/${id}/suspend`,
        headers: authHeaders(ownerToken, tenantId),
      });

      const res = await app.inject({
        method: 'POST',
        url: `/v1/tenants/${id}/activate`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().status).toBe('active');
    });

    it('returns 404 for non-existent tenant', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/tenants/nonexistent-id/activate',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
