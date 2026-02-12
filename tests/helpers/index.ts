import { buildApp } from '@bootstrap/app.js';
import type { FastifyInstance } from 'fastify';

export async function createTestApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  return app;
}

export async function loginAsOwner(
  app: FastifyInstance
): Promise<{ token: string; refreshToken: string; tenantId: string; userId: string }> {
  const res = await app.inject({
    method: 'POST',
    url: '/v1/auth/login',
    payload: { email: 'owner@demo.com', password: 'owner123' },
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login failed with status ${res.statusCode}: ${res.body}`);
  }
  const body = res.json();
  return {
    token: body.token,
    refreshToken: body.refreshToken,
    tenantId: body.user.tenantId,
    userId: body.user.id,
  };
}

export function authHeaders(token: string, tenantId: string) {
  return {
    authorization: `Bearer ${token}`,
    'x-tenant-id': tenantId,
    'content-type': 'application/json',
  };
}

/** Strong password that passes validation: min 8, upper, lower, number, special */
export const STRONG_PASSWORD = 'Test@1234';
