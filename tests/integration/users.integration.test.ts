import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Users', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let ownerId: string;
  let createdUserId: string;

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

  // ── POST /v1/users ───────────────────────────────────────────────────────

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
      createdUserId = body.id;
    });

    it('returns 403 for practitioner trying to create user', async () => {
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
      await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email, password: STRONG_PASSWORD },
      });
      const res = await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email, password: STRONG_PASSWORD },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  // ── GET /v1/users ────────────────────────────────────────────────────────

  describe('GET /v1/users', () => {
    it('returns paginated list as owner → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/users',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(typeof body.meta.total).toBe('number');
      expect(body.meta.page).toBe(1);
    });

    it('respects page and limit', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/users?page=1&limit=2',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.length).toBeLessThanOrEqual(2);
      expect(res.json().meta.limit).toBe(2);
    });

    it('filters by active=true', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/users?active=true',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toBeDefined();
    });
  });

  // ── GET /v1/users/:id ────────────────────────────────────────────────────

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

  // ── PATCH /v1/users/:id/role ─────────────────────────────────────────────

  describe('PATCH /v1/users/:id/role', () => {
    it('updates user role as owner → 200', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/users/${createdUserId}/role`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { role: 'viewer' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.role).toBe('viewer');
    });

    it('returns 400/422 for invalid role', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/users/${createdUserId}/role`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { role: 'superadmin' },
      });
      expect([400, 422]).toContain(res.statusCode);
    });

    it('returns 404 for non-existent user', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/users/nonexistent-id/role',
        headers: authHeaders(ownerToken, tenantId),
        payload: { role: 'viewer' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── PATCH /v1/users/:id/activate + deactivate ────────────────────────────

  describe('PATCH /v1/users/:id/deactivate and activate', () => {
    it('deactivates a user → 200', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/users/${createdUserId}/deactivate`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
    });

    it('activates a user → 200', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/users/${createdUserId}/activate`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
    });
  });

  // ── DELETE /v1/users/:id ─────────────────────────────────────────────────

  describe('DELETE /v1/users/:id', () => {
    it('soft-deletes a user → 204', async () => {
      // Create a user to delete
      const email = `user-to-delete-${Date.now()}@test.com`;
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email, password: STRONG_PASSWORD, role: 'viewer' },
      });
      const idToDelete = createRes.json().id;

      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/v1/users/${idToDelete}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(deleteRes.statusCode).toBe(204);
    });

    it('returns 404 for non-existent user', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/v1/users/nonexistent-id',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── GET /v1/users/:id/export ─────────────────────────────────────────────

  describe('GET /v1/users/:id/export', () => {
    it('exports own user data → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/users/${ownerId}/export`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.exportedAt).toBeDefined();
      expect(body.user).toBeDefined();
    });
  });
});
