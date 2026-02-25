import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Quota', () => {
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

  describe('GET /v1/quota/usage', () => {
    it('returns usage summary as owner → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/quota/usage',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toBeDefined();
      // Should include counts for core resources
      expect(typeof body.patients !== 'undefined' || typeof body.sessions !== 'undefined').toBe(true);
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/quota/usage',
        headers: { 'x-tenant-id': tenantId },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 200 for practitioner role (readOnly)', async () => {
      const practEmail = `pract-quota-${Date.now()}@test.com`;
      await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email: practEmail, password: STRONG_PASSWORD, role: 'practitioner' },
      });
      const loginRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: practEmail, password: STRONG_PASSWORD },
      });
      if (loginRes.statusCode !== 200) return;
      const practToken = loginRes.json().token;

      const res = await app.inject({
        method: 'GET',
        url: '/v1/quota/usage',
        headers: authHeaders(practToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
    });

    it('returns consistent shape on repeated calls', async () => {
      const res1 = await app.inject({
        method: 'GET',
        url: '/v1/quota/usage',
        headers: authHeaders(ownerToken, tenantId),
      });
      const res2 = await app.inject({
        method: 'GET',
        url: '/v1/quota/usage',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res1.statusCode).toBe(200);
      expect(res2.statusCode).toBe(200);
      // Same keys in both responses
      expect(Object.keys(res1.json())).toEqual(Object.keys(res2.json()));
    });
  });
});
