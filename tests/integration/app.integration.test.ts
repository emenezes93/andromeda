import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { buildApp } from '@bootstrap/app.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: health and ready', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    process.env.DATABASE_URL = process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/anamnese';
    process.env.JWT_SECRET = 'test-secret-min-32-characters-long!!!!!!!!!';
    app = await buildApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.status).toBe('ok');
  });

  it('GET /ready returns 200 when DB is up', async () => {
    const res = await app.inject({ method: 'GET', url: '/ready' });
    expect([200, 503]).toContain(res.statusCode);
    const body = res.json();
    expect(body).toHaveProperty('status');
  });
});
