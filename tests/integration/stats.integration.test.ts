import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Stats', () => {
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

  describe('GET /v1/stats/dashboard', () => {
    it('returns 200 with dashboard structure', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/stats/dashboard',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.totalSessions).toBeDefined();
      expect(body.completedSessions).toBeDefined();
      expect(body.totalTemplates).toBeDefined();
      expect(body.sessionsByDay).toBeDefined();
      expect(body.sessionsByTemplate).toBeDefined();
      expect(body.alerts).toBeDefined();
      expect(body.alerts.pendingQuestionnairesCount).toBeDefined();
      expect(body.alerts.highRiskCount).toBeDefined();
    });

    it('accepts days query', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/stats/dashboard?days=7',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.totalSessions).toBeDefined();
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/stats/dashboard',
        headers: { 'x-tenant-id': tenantId },
      });
      expect(res.statusCode).toBe(401);
    });
  });
});
