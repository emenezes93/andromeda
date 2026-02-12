import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('E2E: Complete Assessment Flow', () => {
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

  it('completes the full anamnesis flow: login → template → session → engine loop → insights → audit', async () => {
    const headers = authHeaders(ownerToken, tenantId);

    // 1. Create template
    const templateRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers,
      payload: {
        name: `E2E Template ${Date.now()}`,
        schemaJson: {
          questions: [
            { id: 'q1', text: 'Qualidade do sono (1-10)?', type: 'number', required: true, tags: ['sleep'] },
            { id: 'q2', text: 'Horas de sono?', type: 'number', required: true, tags: ['sleep'] },
            { id: 'q3', text: 'Estresse frequente?', type: 'single', options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'], required: true, tags: ['stress'] },
            { id: 'q4', text: 'Nível de estresse (1-10)?', type: 'number', required: false, tags: ['stress'], showWhen: { questionId: 'q3', operator: 'in', value: ['Frequentemente', 'Sempre'] } },
            { id: 'q5', text: 'Come por emoção?', type: 'single', options: ['Nunca', 'Raramente', 'Às vezes', 'Frequentemente'], required: true, tags: ['food_emotional'] },
          ],
          conditionalLogic: [
            { ifQuestion: 'q3', ifValue: ['Frequentemente', 'Sempre'], thenShow: ['q4'] },
          ],
          tags: ['sleep', 'stress', 'food_emotional'],
        },
      },
    });
    expect(templateRes.statusCode).toBe(201);
    const templateId = templateRes.json().id;

    // 2. Create session
    const sessionRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers,
      payload: { templateId },
    });
    expect(sessionRes.statusCode).toBe(201);
    const sessionId = sessionRes.json().id;

    // 3. Engine loop: get next-question → answer → repeat until completed
    const answers: Record<string, unknown> = {};
    const answerMap: Record<string, unknown> = {
      q1: 4,                // low sleep quality
      q2: 5,                // 5 hours
      q3: 'Sempre',         // high stress → triggers q4
      q4: 9,                // high stress level
      q5: 'Frequentemente', // emotional eating
    };

    let loopCount = 0;
    const maxLoops = 20; // safety limit

    while (loopCount < maxLoops) {
      const engineRes = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/engine/next-question',
        headers,
        payload: { sessionId, currentAnswers: answers },
      });
      expect(engineRes.statusCode).toBe(200);
      const engineBody = engineRes.json();

      if (engineBody.nextQuestion === null || engineBody.reason === 'completed') {
        expect(engineBody.completionPercent).toBe(100);
        break;
      }

      expect(engineBody.nextQuestion.id).toBeDefined();
      expect(engineBody.nextQuestion.text).toBeDefined();
      expect(typeof engineBody.completionPercent).toBe('number');

      const questionId = engineBody.nextQuestion.id;
      // Provide answer from map, or a default
      answers[questionId] = answerMap[questionId] ?? 'Resposta padrão';

      loopCount++;
    }

    expect(loopCount).toBeLessThan(maxLoops); // should complete before safety limit
    expect(Object.keys(answers).length).toBeGreaterThanOrEqual(5); // at least 5 questions answered

    // 4. Submit all answers
    const submitRes = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${sessionId}/answers`,
      headers,
      payload: { answersJson: answers },
    });
    expect(submitRes.statusCode).toBe(201);

    // 5. Generate AI insights
    const insightsRes = await app.inject({
      method: 'POST',
      url: '/v1/ai/insights',
      headers,
      payload: { sessionId },
    });
    expect(insightsRes.statusCode).toBe(200);
    const insights = insightsRes.json();
    expect(insights.summary).toBeDefined();
    expect(insights.risksJson).toBeDefined();
    expect(typeof insights.risksJson.readiness).toBe('number');
    expect(typeof insights.risksJson.dropoutRisk).toBe('number');
    expect(typeof insights.risksJson.stress).toBe('number');
    expect(typeof insights.risksJson.sleepQuality).toBe('number');
    expect(insights.recommendationsJson).toBeDefined();

    // Verify risk scores make sense given the answers
    expect(insights.risksJson.stress).toBeGreaterThan(70); // "Sempre" → high stress
    expect(insights.risksJson.sleepQuality).toBeLessThan(50); // 4/10 quality, 5h sleep

    // 6. Verify insights can be retrieved
    const getInsightsRes = await app.inject({
      method: 'GET',
      url: `/v1/ai/insights/${sessionId}`,
      headers,
    });
    expect(getInsightsRes.statusCode).toBe(200);
    expect(getInsightsRes.json().id).toBe(insights.id);

    // 7. Check audit logs contain our actions
    const auditRes = await app.inject({
      method: 'GET',
      url: '/v1/audit?limit=100',
      headers,
    });
    expect(auditRes.statusCode).toBe(200);
    const auditLogs = auditRes.json().data;
    const actions = auditLogs.map((l: { action: string }) => l.action);
    expect(actions).toContain('login');

    // Check that entities were logged
    const entities = auditLogs.map((l: { entity: string }) => l.entity);
    expect(entities).toContain('user'); // from login
  });
});
