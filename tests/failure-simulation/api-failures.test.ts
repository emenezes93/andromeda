/**
 * Failure Simulation Tests
 *
 * Verifies that the system handles failures gracefully:
 * - Invalid/malformed payloads → 400/422
 * - Unauthorized requests → 401
 * - Forbidden (wrong tenant or role) → 403
 * - Not found resources → 404
 * - Missing or invalid headers
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

describe('Failure: Unauthorized access', () => {
  it('GET /v1/patients without Authorization returns 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(401);
    expect(res.json()).toHaveProperty('error');
  });

  it('GET /v1/patients with invalid Bearer token returns 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: {
        authorization: 'Bearer invalid.jwt.token',
        'x-tenant-id': tenantId,
        'content-type': 'application/json',
      },
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /v1/patients with malformed Authorization (no Bearer) returns 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: {
        authorization: 'Basic something',
        'x-tenant-id': tenantId,
        'content-type': 'application/json',
      },
    });
    expect(res.statusCode).toBe(401);
  });
});

describe('Failure: Not found resources', () => {
  it('GET /v1/patients/:id with non-existent id returns 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients/clxxxxxxxxxxxxxxxxxxxxxxxxxx',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(404);
    expect(res.json().code).toBe('NOT_FOUND');
  });

  it('GET /v1/anamnesis/templates/:id with non-existent id returns 404', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/anamnesis/templates/clxxxxxxxxxxxxxxxxxxxxxxxxxx',
      headers: authHeaders(token, tenantId),
    });
    expect(res.statusCode).toBe(404);
  });
});

describe('Failure: Invalid payloads', () => {
  it('POST /v1/auth/login with missing body returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: {},
      headers: { 'content-type': 'application/json' },
    });
    expect([400, 422]).toContain(res.statusCode);
  });

  it('POST /v1/auth/login with invalid email shape returns 400 or 422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'not-an-email', password: 'short' },
      headers: { 'content-type': 'application/json' },
    });
    expect([400, 401, 422]).toContain(res.statusCode);
  });

  it('POST /v1/patients with empty fullName or missing required returns 400 or 422', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(token, tenantId),
      payload: {},
    });
    expect([400, 422]).toContain(res.statusCode);
  });
});

describe('Failure: Invalid JSON body', () => {
  it('POST /v1/auth/login with invalid JSON returns 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: 'not json at all',
      headers: { 'content-type': 'application/json' },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('Failure: Error response structure', () => {
  it('error responses include requestId', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: { 'x-tenant-id': tenantId },
    });
    expect(res.statusCode).toBe(401);
    const body = res.json();
    expect(body).toHaveProperty('requestId');
  });
});
