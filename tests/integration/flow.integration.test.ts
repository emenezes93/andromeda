import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '@bootstrap/app.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: protected routes require auth and tenant', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/anamnese';
    process.env.JWT_SECRET = 'test-secret-min-32-characters-long!!!!!!!!!';
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /v1/tenants/:id without auth returns 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/tenants/some-id',
      headers: { 'x-tenant-id': 'some-tenant' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /v1/tenants/:id without x-tenant-id returns 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/v1/tenants/some-id',
      headers: { authorization: 'Bearer invalid-token' },
    });
    expect(res.statusCode).toBe(401);
  });
});
