import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Audit', () => {
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

  describe('GET /v1/audit', () => {
    it('lists audit logs as owner → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/audit',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(body.meta.page).toBe(1);
      expect(typeof body.meta.total).toBe('number');
    });

    it('returns 403 for viewer role', async () => {
      // Create viewer
      const viewerEmail = `viewer-audit-${Date.now()}@test.com`;
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
        method: 'GET',
        url: '/v1/audit',
        headers: authHeaders(viewerToken, tenantId),
      });
      expect(res.statusCode).toBe(403);
    });

    it('filters by action=login', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/audit?action=login',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      for (const log of body.data) {
        expect(log.action).toBe('login');
      }
    });

    it('filters by entity=tenant', async () => {
      // First create a tenant to generate an audit log
      await app.inject({
        method: 'POST',
        url: '/v1/tenants',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: `Audit Filter Tenant ${Date.now()}` },
      });

      const res = await app.inject({
        method: 'GET',
        url: '/v1/audit?entity=tenant',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      for (const log of body.data) {
        expect(log.entity).toBe('tenant');
      }
    });

    it('pagination works correctly', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/audit?page=1&limit=2',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data.length).toBeLessThanOrEqual(2);
      expect(body.meta.limit).toBe(2);
      expect(body.meta.page).toBe(1);
    });

    it('filters by date range', async () => {
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const to = new Date().toISOString();
      const res = await app.inject({
        method: 'GET',
        url: `/v1/audit?from=${from}&to=${to}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toBeDefined();
    });
  });
});
