import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Users', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let ownerId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;
    ownerId = login.userId;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/users', () => {
    it('creates a user as owner → 201', async () => {
      const email = `user-create-${Date.now()}@test.com`;
      const res = await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email, password: STRONG_PASSWORD, name: 'New User', role: 'practitioner' },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.email).toBe(email);
      expect(body.name).toBe('New User');
    });

    it('returns 403 for practitioner trying to create user', async () => {
      // Create a practitioner
      const practEmail = `pract-${Date.now()}@test.com`;
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
        method: 'POST',
        url: '/v1/users',
        headers: authHeaders(practToken, tenantId),
        payload: { email: `from-pract-${Date.now()}@test.com`, password: STRONG_PASSWORD },
      });
      expect(res.statusCode).toBe(403);
    });

    it('returns 400 for duplicate user in same tenant', async () => {
      const email = `dup-user-${Date.now()}@test.com`;
      // first create
      await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email, password: STRONG_PASSWORD },
      });
      // duplicate
      const res = await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email, password: STRONG_PASSWORD },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /v1/users/:id', () => {
    it('returns user details for existing user → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/users/${ownerId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(ownerId);
      expect(body.email).toBe('owner@demo.com');
      expect(body.role).toBe('owner');
    });

    it('returns 404 for non-existent user in tenant', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/users/nonexistent-user-id',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
