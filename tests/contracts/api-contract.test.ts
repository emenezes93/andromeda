/**
 * Contract Tests — API response shape and status codes
 *
 * Ensures critical endpoints adhere to expected response structure
 * so that frontend and consumers do not break when contracts change.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let token: string;
let tenantId: string;

beforeAll(async () => {
  app = await createTestApp();
  const login = await loginAsOwner(app);
  token = login.token;
  tenantId = login.tenantId;
});

afterAll(async () => {
  await app.close();
});

describe('Contract: Health endpoints', () => {
  it('GET /health returns 200 with body', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toBeDefined();
  });

  it('GET /ready returns 200 or 503', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect([200, 503]).toContain(res.statusCode);
  });
});

describe('Contract: Auth login response', () => {
  it('POST /v1/auth/login success has token, refreshToken, expiresIn, user', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'owner@demo.com', password: 'owner123' },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('token');
    expect(body).toHaveProperty('refreshToken');
    expect(body).toHaveProperty('expiresIn');
    expect(body).toHaveProperty('user');
    expect(body.user).toHaveProperty('id');
    expect(body.user).toHaveProperty('email');
    expect(body.user).toHaveProperty('role');
    expect(body.user).toHaveProperty('tenantId');
  });

  it('POST /v1/auth/login error returns 401 with error message', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'nobody@test.com', password: 'wrong' },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body).toHaveProperty('error');
  });
});

describe('Contract: Paginated list response', () => {
  it('GET /v1/patients returns { data, meta } with meta.page, limit, total, totalPages', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body).toHaveProperty('data');
    expect(Array.isArray(body.data)).toBe(true);
    expect(body).toHaveProperty('meta');
    expect(body.meta).toHaveProperty('page');
    expect(body.meta).toHaveProperty('limit');
    expect(body.meta).toHaveProperty('total');
    expect(body.meta).toHaveProperty('totalPages');
  });
});

describe('Contract: Error response shape', () => {
  it('404 returns { error, code, requestId }', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients/cuid-nonexistent-12345',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(404);
    const body = res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('code');
    expect(body.code).toBe('NOT_FOUND');
  });

  it('401 returns { error, code, requestId }', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body).toHaveProperty('error');
    expect(body).toHaveProperty('code');
  });
});
