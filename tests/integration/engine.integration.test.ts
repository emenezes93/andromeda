import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '@bootstrap/app.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: engine next-question', () => {
  let app: FastifyInstance;
  let token: string;
  let tenantId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/anamnese';
    process.env.JWT_SECRET = 'test-secret-min-32-characters-long!!!!!!!!!';
    app = await buildApp();
    const loginRes = await app.inject({
      method: 'POST',
      url: '/v1/auth/login',
      payload: { email: 'owner@demo.com', password: 'owner123' },
    });
    if (loginRes.statusCode === 200) {
      const body = loginRes.json();
      token = body.token;
      tenantId = body.user.tenantId;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /v1/anamnesis/engine/next-question without session returns 404 or 200', async () => {
    if (!token) return;
    const res = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/engine/next-question',
      headers: {
        authorization: `Bearer ${token}`,
        'x-tenant-id': tenantId,
      },
      payload: { sessionId: 'non-existent-session', currentAnswers: {} },
    });
    expect(res.statusCode).toBe(404);
  });
});
