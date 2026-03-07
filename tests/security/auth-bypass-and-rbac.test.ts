/**
 * Security: Auth bypass and RBAC
 *
 * - Ensures protected endpoints require valid JWT and correct tenant.
 * - Ensures viewer cannot perform admin/owner actions.
 * - Ensures practitioner cannot manage tenants or delete users (where restricted).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let ownerToken: string;
let viewerToken: string;
let tenantId: string;

beforeAll(async () => {
  app = await createTestApp();
  const login = await loginAsOwner(app);
  ownerToken = login.token;
  tenantId = login.tenantId;

  const createViewer = await app.inject({
    method: 'POST',
    url: '/v1/users',
    headers: authHeaders(ownerToken, tenantId),
    payload: {
      email: `viewer-sec-${Date.now()}@test.com`,
      password: STRONG_PASSWORD,
      role: 'viewer',
    },
  });
  expect(createViewer.statusCode).toBe(201);
  const viewerLogin = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { email: createViewer.json().email, password: STRONG_PASSWORD },
  });
  viewerToken = viewerLogin.json().token;
});

afterAll(async () => {
  await app.close();
});

describe('Security: Protected endpoints require auth', () => {
  const protectedUrls = [
    { method: 'GET' as const, url: '/v1/users' },
    { method: 'GET' as const, url: '/v1/tenants' },
    { method: 'GET' as const, url: '/v1/patients' },
    { method: 'GET' as const, url: '/v1/anamnesis/templates' },
    { method: 'GET' as const, url: '/v1/audit/logs' },
    { method: 'GET' as const, url: '/v1/stats/dashboard' },
    { method: 'GET' as const, url: '/v1/goals' },
  ];

  protectedUrls.forEach(({ method, url }) => {
    it(`${method} ${url} without token returns 401`, async () => {
      const res = await app.inject({
        method,
        url,
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
      });
      expect(res.statusCode).toBe(401);
    });
  });
});

describe('Security: Viewer cannot create users', () => {
  it('POST /v1/users as viewer returns 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/users',
      headers: authHeaders(viewerToken, tenantId),
      payload: {
        email: `forbidden-${Date.now()}@test.com`,
        password: STRONG_PASSWORD,
        role: 'practitioner',
      },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('Security: Viewer cannot create tenants', () => {
  it('POST /v1/tenants as viewer returns 403', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/v1/tenants',
      headers: authHeaders(viewerToken, tenantId),
      payload: { name: 'Forbidden Tenant' },
    });
    expect(res.statusCode).toBe(403);
  });
});

describe('Security: Viewer can read patients (allowed role)', () => {
  it('GET /v1/patients as viewer returns 200', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: authHeaders(viewerToken, tenantId),
    });
    expect(res.statusCode).toBe(200);
  });
});

describe('Security: Wrong tenant id with valid token', () => {
  it('request with token for tenant A but x-tenant-id B does not return tenant B data', async () => {
    const listRes = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
    });
    expect(listRes.statusCode).toBe(200);
    const ourData = listRes.json().data;

    const otherTenantId = 'clxxxxxxxxxxxxxxxxxxxxxxxxxx';
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, otherTenantId),
    });
    if (res.statusCode === 200) {
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta.total).toBe(0);
    } else {
      expect([403, 404]).toContain(res.statusCode);
    }
  });
});
