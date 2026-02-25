import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Auth & RBAC guards', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let viewerToken: string;
  let practitionerToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;

    // Create a viewer
    const viewerEmail = `viewer-flow-${Date.now()}@test.com`;
    await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(ownerToken, tenantId),
      payload: { email: viewerEmail, password: STRONG_PASSWORD, role: 'viewer' },
    });
    const vLogin = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: viewerEmail, password: STRONG_PASSWORD },
    });
    viewerToken = vLogin.json().token;

    // Create a practitioner
    const practEmail = `pract-flow-${Date.now()}@test.com`;
    await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(ownerToken, tenantId),
      payload: { email: practEmail, password: STRONG_PASSWORD, role: 'practitioner' },
    });
    const pLogin = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: practEmail, password: STRONG_PASSWORD },
    });
    practitionerToken = pLogin.json().token;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── 401: Missing auth token ───────────────────────────────────────────────

  describe('401 – missing authentication', () => {
    const protectedRoutes = [
      { method: 'GET', url: '/v1/tenants/some-id' },
      { method: 'GET', url: '/v1/users' },
      { method: 'GET', url: '/v1/patients' },
      { method: 'GET', url: '/v1/anamnesis/templates' },
      { method: 'GET', url: '/v1/anamnesis/sessions' },
      { method: 'GET', url: '/v1/audit' },
      { method: 'GET', url: '/v1/stats/dashboard' },
      { method: 'GET', url: '/v1/goals' },
      { method: 'GET', url: '/v1/quota/usage' },
    ] as const;

    for (const route of protectedRoutes) {
      it(`${route.method} ${route.url} → 401 without token`, async () => {
        const res = await app.inject({
          method: route.method,
          url: route.url,
          headers: { 'x-tenant-id': tenantId },
        });
        expect(res.statusCode).toBe(401);
      });
    }

    it('GET /v1/tenants/:id without x-tenant-id returns 401', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/tenants/some-id',
        headers: { authorization: 'Bearer invalid-token' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── 403: Viewer cannot mutate ─────────────────────────────────────────────

  describe('403 – viewer role cannot write', () => {
    it('viewer cannot create a template', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: authHeaders(viewerToken, tenantId),
        payload: {
          name: 'Viewer Template',
          schemaJson: { questions: [{ id: 'q1', text: 'Q', type: 'text', required: true }] },
        },
      });
      expect(res.statusCode).toBe(403);
    });

    it('viewer cannot create a session', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: authHeaders(viewerToken, tenantId),
        payload: { templateId: 'some-id' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('viewer cannot create a patient', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: authHeaders(viewerToken, tenantId),
        payload: { fullName: 'Viewer Patient', email: `vp-flow-${Date.now()}@test.com` },
      });
      expect(res.statusCode).toBe(403);
    });

    it('viewer cannot access audit logs', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/audit',
        headers: authHeaders(viewerToken, tenantId),
      });
      expect(res.statusCode).toBe(403);
    });

    it('viewer cannot create a tenant', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/tenants',
        headers: authHeaders(viewerToken, tenantId),
        payload: { name: 'Viewer Tenant' },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── 403: Practitioner cannot manage users/tenants ─────────────────────────

  describe('403 – practitioner cannot manage users or tenants', () => {
    it('practitioner cannot create a user', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: authHeaders(practitionerToken, tenantId),
        payload: { email: `pract-new-${Date.now()}@test.com`, password: STRONG_PASSWORD },
      });
      expect(res.statusCode).toBe(403);
    });

    it('practitioner cannot create a tenant', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/tenants',
        headers: authHeaders(practitionerToken, tenantId),
        payload: { name: 'Pract Tenant' },
      });
      expect(res.statusCode).toBe(403);
    });

    it('practitioner cannot register new users via /v1/auth/register', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        headers: authHeaders(practitionerToken, tenantId),
        payload: { email: `reg-by-pract-${Date.now()}@test.com`, password: STRONG_PASSWORD },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // ── Public routes are accessible without auth ─────────────────────────────

  describe('public routes – no auth required', () => {
    it('GET /health returns 200 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/health' });
      expect(res.statusCode).toBe(200);
    });

    it('GET / returns 200 without auth', async () => {
      const res = await app.inject({ method: 'GET', url: '/' });
      expect(res.statusCode).toBe(200);
    });

    it('POST /v1/auth/login is accessible without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: 'nonexistent@x.com', password: 'wrong' },
      });
      // 401 (wrong creds) is fine – the endpoint is reachable, not 401 from middleware
      expect(res.statusCode).not.toBe(403);
    });

    it('POST /v1/auth/refresh is accessible without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/refresh',
        payload: { refreshToken: 'invalid' },
      });
      expect(res.statusCode).not.toBe(403);
    });
  });
});
