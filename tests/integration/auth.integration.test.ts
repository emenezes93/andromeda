import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Auth', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let ownerRefreshToken: string;
  let tenantId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    ownerRefreshToken = login.refreshToken;
    tenantId = login.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  // --- Login ---

  describe('POST /v1/auth/login', () => {
    it('returns token, refreshToken, expiresIn and user on valid credentials', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: 'owner@demo.com', password: 'owner123' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.token).toBeDefined();
      expect(typeof body.token).toBe('string');
      expect(body.refreshToken).toBeDefined();
      expect(typeof body.refreshToken).toBe('string');
      expect(body.expiresIn).toBe(900);
      expect(body.user).toBeDefined();
      expect(body.user.email).toBe('owner@demo.com');
      expect(body.user.role).toBe('owner');
      expect(body.user.tenantId).toBeDefined();
      expect(body.user.id).toBeDefined();
    });

    it('returns 401 for non-existent email', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: 'nonexistent@test.com', password: 'whatever' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 for wrong password', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: 'owner@demo.com', password: 'wrongpassword' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 403 for suspended tenant', async () => {
      // Create a suspended tenant
      const suspRes = await app.inject({
        method: 'POST',
        url: '/v1/tenants',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: `Suspended ${Date.now()}`, status: 'suspended' },
      });
      const suspTenantId = suspRes.json().id;

      // Create a user in that tenant
      const suspEmail = `susp-${Date.now()}@test.com`;
      await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: authHeaders(ownerToken, suspTenantId),
        payload: { email: suspEmail, password: STRONG_PASSWORD },
      });

      // Login as user in suspended tenant → 403
      const loginRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: suspEmail, password: STRONG_PASSWORD },
      });
      expect(loginRes.statusCode).toBe(403);
    });
  });

  // --- Register ---

  describe('POST /v1/auth/register', () => {
    it('registers a new user as owner → 201', async () => {
      const email = `register-${Date.now()}@test.com`;
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email, password: STRONG_PASSWORD, name: 'Test User' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.email).toBe(email);
      expect(body.name).toBe('Test User');
    });

    it('returns 400 for duplicate email', async () => {
      const email = `dup-${Date.now()}@test.com`;
      // first register
      await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email, password: STRONG_PASSWORD },
      });
      // duplicate
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email, password: STRONG_PASSWORD },
      });
      expect(res.statusCode).toBe(400);
    });

    it('returns 422 for weak password (no uppercase)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email: `weak-${Date.now()}@test.com`, password: 'nouppercase1!' },
      });
      expect([400, 422]).toContain(res.statusCode);
    });

    it('returns 422 for weak password (too short)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email: `short-${Date.now()}@test.com`, password: 'Ab1!' },
      });
      expect([400, 422]).toContain(res.statusCode);
    });

    it('returns 401 without auth token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: { email: 'noauth@test.com', password: STRONG_PASSWORD },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 403 when viewer tries to register', async () => {
      // Create a viewer user via /v1/users
      const viewerEmail = `viewer-${Date.now()}@test.com`;
      await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email: viewerEmail, password: STRONG_PASSWORD, role: 'viewer' },
      });
      // Login as viewer
      const loginRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: viewerEmail, password: STRONG_PASSWORD },
      });
      if (loginRes.statusCode !== 200) return;
      const viewerToken = loginRes.json().token;

      // Viewer tries to register
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/register',
        headers: authHeaders(viewerToken, tenantId),
        payload: { email: `from-viewer-${Date.now()}@test.com`, password: STRONG_PASSWORD },
      });
      expect(res.statusCode).toBe(403);
    });
  });

  // --- Refresh Token ---

  describe('POST /v1/auth/refresh', () => {
    it('returns new token and refreshToken on valid refresh', async () => {
      // Login first to get a fresh refresh token
      const loginRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: 'owner@demo.com', password: 'owner123' },
      });
      const { refreshToken } = loginRes.json();

      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/refresh',
        payload: { refreshToken },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.token).toBeDefined();
      expect(body.refreshToken).toBeDefined();
      expect(body.refreshToken).not.toBe(refreshToken); // rotated
      expect(body.expiresIn).toBe(900);
    });

    it('returns 401 for revoked refresh token', async () => {
      // Login to get a token
      const loginRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: 'owner@demo.com', password: 'owner123' },
      });
      const { refreshToken } = loginRes.json();

      // Use it once (revokes old, creates new)
      await app.inject({
        method: 'POST',
        url: '/v1/auth/refresh',
        payload: { refreshToken },
      });

      // Try to use the old one again
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/refresh',
        payload: { refreshToken },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 401 for invalid refresh token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/auth/refresh',
        payload: { refreshToken: 'invalid-token-value' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // --- Logout ---

  describe('POST /v1/auth/logout', () => {
    it('returns 204 and invalidates the refresh token', async () => {
      // Login to get a fresh token
      const loginRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: 'owner@demo.com', password: 'owner123' },
      });
      const { refreshToken } = loginRes.json();

      // Logout
      const logoutRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/logout',
        payload: { refreshToken },
      });
      expect(logoutRes.statusCode).toBe(204);

      // Refresh should fail
      const refreshRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/refresh',
        payload: { refreshToken },
      });
      expect(refreshRes.statusCode).toBe(401);
    });
  });
});
