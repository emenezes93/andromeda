import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: AI Insights', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let sessionWithAnswers: string;
  let sessionWithoutAnswers: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;

    // Create a template
    const templateRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        name: `AI Test Template ${Date.now()}`,
        schemaJson: {
          questions: [
            { id: 'q1', text: 'Qualidade do sono (1-10)?', type: 'number', required: true, tags: ['sleep'] },
            { id: 'q3', text: 'Estresse?', type: 'single', options: ['Nunca', 'Às vezes', 'Sempre'], required: true, tags: ['stress'] },
          ],
        },
      },
    });
    const templateId = templateRes.json().id;

    // Create session with answers
    const session1 = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(ownerToken, tenantId),
      payload: { templateId },
    });
    sessionWithAnswers = session1.json().id;

    await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${sessionWithAnswers}/answers`,
      headers: authHeaders(ownerToken, tenantId),
      payload: { answersJson: { q1: 3, q3: 'Sempre' } },
    });

    // Create session without answers
    const session2 = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(ownerToken, tenantId),
      payload: { templateId },
    });
    sessionWithoutAnswers = session2.json().id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/ai/insights', () => {
    it('generates insights for session with answers → 200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/ai/insights',
        headers: authHeaders(ownerToken, tenantId),
        payload: { sessionId: sessionWithAnswers },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.sessionId).toBe(sessionWithAnswers);
      expect(body.summary).toBeDefined();
      expect(body.risksJson).toBeDefined();
      expect(body.recommendationsJson).toBeDefined();
    });

    it('returns existing insights on duplicate call → 200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/ai/insights',
        headers: authHeaders(ownerToken, tenantId),
        payload: { sessionId: sessionWithAnswers },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.sessionId).toBe(sessionWithAnswers);
    });

    it('generates insights for session without answers (default result)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/ai/insights',
        headers: authHeaders(ownerToken, tenantId),
        payload: { sessionId: sessionWithoutAnswers },
      });
      // Should return 200 with default/empty insights
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.risksJson).toBeDefined();
    });

    it('returns 404 for non-existent session', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/ai/insights',
        headers: authHeaders(ownerToken, tenantId),
        payload: { sessionId: 'nonexistent-session-id' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('GET /v1/ai/insights/:sessionId', () => {
    it('returns stored insights by sessionId → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/ai/insights/${sessionWithAnswers}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.sessionId).toBe(sessionWithAnswers);
      expect(body.summary).toBeDefined();
      expect(body.risksJson).toBeDefined();
      expect(body.recommendationsJson).toBeDefined();
    });

    it('returns 404 for session with no insights', async () => {
      // Create a session that has no insights generated
      const templateRes = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          name: `No Insights Template ${Date.now()}`,
          schemaJson: {
            questions: [{ id: 'q1', text: 'Test', type: 'text', required: true }],
          },
        },
      });
      const sessionRes = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: authHeaders(ownerToken, tenantId),
        payload: { templateId: templateRes.json().id },
      });

      const res = await app.inject({
        method: 'GET',
        url: `/v1/ai/insights/${sessionRes.json().id}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
