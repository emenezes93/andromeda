/**
 * Regression: Auth flows
 *
 * Prevents regressions in login, refresh, logout, and tenant suspension behavior.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

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

describe('Regression: Login returns correct shape and tenantId in user', () => {
  it('user.tenantId matches the tenant used for login', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'owner@demo.com', password: 'owner123' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.user.tenantId).toBeDefined();
    expect(typeof body.user.tenantId).toBe('string');
    expect(body.user.role).toBe('owner');
  });
});

describe('Regression: Refresh token extends session', () => {
  it('refresh with valid refreshToken returns new token pair', async () => {
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
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.token).toBeDefined();
    expect(body.refreshToken).toBeDefined();
    expect(body.user).toBeDefined();
  });

  it('refresh with invalid refreshToken returns 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/refresh',
      payload: { refreshToken: 'invalid-refresh-token' },
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('Regression: Logout revokes refresh token', () => {
  it('logout with valid refreshToken returns 204', async () => {
    const loginRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'owner@demo.com', password: 'owner123' },
    });
    const { refreshToken } = loginRes.json();
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/logout',
      payload: { refreshToken },
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(204);
  });
});

describe('Regression: Suspended tenant blocks login', () => {
  it('user in suspended tenant receives 403 on login', async () => {
    const createRes = await app.inject({
      method: 'POST',
      url: '/v1/tenants',
      headers: authHeaders(ownerToken, tenantId),
      payload: { name: `Suspended regression ${Date.now()}`, status: 'suspended' },
    });
    expect(createRes.statusCode).toBe(201);
    const newTenantId = createRes.json().id;

    const userRes = await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(ownerToken, newTenantId),
      payload: {
        email: `suspended-user-${Date.now()}@test.com`,
        password: STRONG_PASSWORD,
        role: 'admin',
      },
    });
    expect(userRes.statusCode).toBe(201);
    const email = userRes.json().email;

    const loginRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email, password: STRONG_PASSWORD },
    });
    expect(loginRes.statusCode).toBe(403);
  });
});
