/**
 * Regression: Tenant isolation
 *
 * Ensures that tenant A cannot access tenant B's resources.
 * Critical for multi-tenant security.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

let app: FastifyInstance;
let ownerToken: string;
let tenantAId: string;
let tenantBId: string;
let patientInB: string;

beforeAll(async () => {
  app = await createTestApp();
  const login = await loginAsOwner(app);
  ownerToken = login.token;
  tenantAId = login.tenantId;

  const createB = await app.inject({
    method: 'POST',
    url: '/v1/tenants',
    headers: authHeaders(ownerToken, tenantAId),
    payload: { name: `Tenant B isolation ${Date.now()}` },
  });
  expect(createB.statusCode).toBe(201);
  tenantBId = createB.json().id;

  const userB = await app.inject({
    method: 'POST',
    url: '/v1/users',
    headers: authHeaders(ownerToken, tenantBId),
    payload: {
      email: `owner-b-${Date.now()}@test.com`,
      password: STRONG_PASSWORD,
      role: 'owner',
    },
  });
  expect(userB.statusCode).toBe(201);

  const loginB = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { email: userB.json().email, password: STRONG_PASSWORD },
  });
  const tokenB = loginB.json().token;

  const patientRes = await app.inject({
    method: 'POST',
    url: '/v1/patients',
    headers: authHeaders(tokenB, tenantBId),
    payload: { fullName: 'Patient in Tenant B', email: `pb-${Date.now()}@test.com` },
  });
  expect(patientRes.statusCode).toBe(201);
  patientInB = patientRes.json().id;
});

afterAll(async () => {
  await app.close();
});

describe('Regression: Cross-tenant patient access', () => {
  it('tenant A cannot GET tenant B patient by id (404 or empty)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/v1/patients/${patientInB}`,
      headers: authHeaders(ownerToken, tenantAId),
    });
    expect(res.statusCode).toBe(404);
  });

  it('tenant A list patients does not include tenant B patients', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantAId),
    });
    expect(res.statusCode).toBe(200);
    const data = res.json().data as { id: string }[];
    const ids = data.map((p) => p.id);
    expect(ids).not.toContain(patientInB);
  });
});
