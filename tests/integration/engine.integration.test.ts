import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Engine – next-question', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let sessionId: string;
  let conditionalSessionId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;

    // Simple linear template
    const tplRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        name: `Engine Test Template ${Date.now()}`,
        schemaJson: {
          questions: [
            { id: 'q1', text: 'Pergunta 1', type: 'text', required: true },
            { id: 'q2', text: 'Pergunta 2', type: 'number', required: true },
            { id: 'q3', text: 'Pergunta 3', type: 'single', options: ['Sim', 'Não'], required: true },
          ],
        },
      },
    });
    const tplId = tplRes.json().id;
    const sRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(ownerToken, tenantId),
      payload: { templateId: tplId },
    });
    sessionId = sRes.json().id;

    // Template with conditional logic
    const condTplRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        name: `Engine Conditional Template ${Date.now()}`,
        schemaJson: {
          questions: [
            { id: 'q1', text: 'Tem estresse?', type: 'single', options: ['Sim', 'Não'], required: true, tags: ['stress'] },
            { id: 'q2', text: 'Nível de estresse', type: 'number', required: true, tags: ['stress'], showWhen: { questionId: 'q1', operator: 'eq', value: 'Sim' } },
          ],
          conditionalLogic: [{ ifQuestion: 'q1', ifValue: 'Sim', thenShow: ['q2'] }],
        },
      },
    });
    const condSRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(ownerToken, tenantId),
      payload: { templateId: condTplRes.json().id },
    });
    conditionalSessionId = condSRes.json().id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /v1/anamnesis/engine/next-question ──────────────────────────────

  describe('POST /v1/anamnesis/engine/next-question', () => {
    it('returns first question when no answers given', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/engine/next-question',
        headers: authHeaders(ownerToken, tenantId),
        payload: { sessionId, currentAnswers: {} },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.nextQuestion).not.toBeNull();
      expect(body.nextQuestion.id).toBe('q1');
      expect(body.reason).toBe('conditional');
      expect(body.completionPercent).toBe(0);
    });

    it('returns second question after first is answered', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/engine/next-question',
        headers: authHeaders(ownerToken, tenantId),
        payload: { sessionId, currentAnswers: { q1: 'Resposta 1' } },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.nextQuestion).not.toBeNull();
      expect(body.nextQuestion.id).toBe('q2');
      expect(body.completionPercent).toBeGreaterThan(0);
    });

    it('returns completed when all questions answered', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/engine/next-question',
        headers: authHeaders(ownerToken, tenantId),
        payload: { sessionId, currentAnswers: { q1: 'R1', q2: 5, q3: 'Sim' } },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.nextQuestion).toBeNull();
      expect(body.reason).toBe('completed');
      expect(body.completionPercent).toBe(100);
    });

    it('skips conditional question when condition is not met', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/engine/next-question',
        headers: authHeaders(ownerToken, tenantId),
        payload: { sessionId: conditionalSessionId, currentAnswers: { q1: 'Não' } },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.nextQuestion).toBeNull();
      expect(body.reason).toBe('completed');
    });

    it('includes conditional question when condition is met', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/engine/next-question',
        headers: authHeaders(ownerToken, tenantId),
        payload: { sessionId: conditionalSessionId, currentAnswers: { q1: 'Sim' } },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.nextQuestion).not.toBeNull();
      expect(body.nextQuestion.id).toBe('q2');
    });

    it('completionPercent increases as more questions are answered', async () => {
      const resEmpty = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/engine/next-question',
        headers: authHeaders(ownerToken, tenantId),
        payload: { sessionId, currentAnswers: {} },
      });
      const resPartial = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/engine/next-question',
        headers: authHeaders(ownerToken, tenantId),
        payload: { sessionId, currentAnswers: { q1: 'R1', q2: 3 } },
      });
      expect(resPartial.json().completionPercent).toBeGreaterThan(
        resEmpty.json().completionPercent,
      );
    });

    it('returns 404 for non-existent session', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/engine/next-question',
        headers: authHeaders(ownerToken, tenantId),
        payload: { sessionId: 'nonexistent-session-id', currentAnswers: {} },
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/engine/next-question',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: { sessionId, currentAnswers: {} },
      });
      expect(res.statusCode).toBe(401);
    });

    it('full loop completes within safety limit', async () => {
      // Create session for loop test
      const tplRes = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          name: `Engine Loop Template ${Date.now()}`,
          schemaJson: {
            questions: [
              { id: 'a', text: 'Q A', type: 'text', required: true },
              { id: 'b', text: 'Q B', type: 'text', required: true },
              { id: 'c', text: 'Q C', type: 'text', required: true },
            ],
          },
        },
      });
      const loopSessionRes = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: authHeaders(ownerToken, tenantId),
        payload: { templateId: tplRes.json().id },
      });
      const loopSessionId = loopSessionRes.json().id;

      const answers: Record<string, unknown> = {};
      let loopCount = 0;
      while (loopCount < 10) {
        const engineRes = await app.inject({
          method: 'POST',
          url: '/v1/anamnesis/engine/next-question',
          headers: authHeaders(ownerToken, tenantId),
          payload: { sessionId: loopSessionId, currentAnswers: answers },
        });
        expect(engineRes.statusCode).toBe(200);
        const { nextQuestion, reason } = engineRes.json();
        if (!nextQuestion || reason === 'completed') break;
        answers[nextQuestion.id] = 'resposta';
        loopCount++;
      }
      expect(loopCount).toBeLessThan(10);
      expect(Object.keys(answers)).toHaveLength(3);
    });
  });
});
