import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Public Fill Flow', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let templateId: string;
  let sessionId: string;
  let fillToken: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;

    // Create template with multiple questions
    const templateRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        name: `Public Fill Template ${Date.now()}`,
        schemaJson: {
          questions: [
            { id: 'q1', text: 'Como você está se sentindo?', type: 'text', required: true },
            { id: 'q2', text: 'Nível de energia (1-10)', type: 'number', required: true },
            { id: 'q3', text: 'Dormiu bem?', type: 'single', options: ['Sim', 'Não'], required: true },
          ],
        },
      },
    });
    templateId = templateRes.json().id;

    // Create session
    const sessionRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/sessions',
      headers: authHeaders(ownerToken, tenantId),
      payload: { templateId },
    });
    sessionId = sessionRes.json().id;

    // Generate fill link
    const linkRes = await app.inject({
      method: 'POST',
      url: `/v1/anamnesis/sessions/${sessionId}/fill-link`,
      headers: authHeaders(ownerToken, tenantId),
    });
    expect(linkRes.statusCode).toBe(200);
    fillToken = linkRes.json().fillToken;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Fill link generation ─────────────────────────────────────────────────

  describe('POST /v1/anamnesis/sessions/:id/fill-link', () => {
    it('returns fillToken and fillUrl → 200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/anamnesis/sessions/${sessionId}/fill-link`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(typeof body.fillToken).toBe('string');
      expect(body.fillToken.length).toBeGreaterThan(0);
      expect(body.fillUrl).toBeDefined();
    });

    it('returns 404 for non-existent session', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions/nonexistent-session/fill-link',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/anamnesis/sessions/${sessionId}/fill-link`,
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /v1/public/fill/:token ───────────────────────────────────────────

  describe('GET /v1/public/fill/:token', () => {
    it('returns session data with valid token → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/public/fill/${fillToken}`,
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body).toBeDefined();
    });

    it('returns 404 for invalid token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/public/fill/invalid-token-that-does-not-exist',
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── POST /v1/public/fill/:token/next-question ────────────────────────────

  describe('POST /v1/public/fill/:token/next-question', () => {
    it('returns first question with no answers → 200', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/public/fill/${fillToken}/next-question`,
        payload: { answersJson: {} },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.nextQuestion).not.toBeNull();
      expect(body.nextQuestion.id).toBeDefined();
      expect(body.nextQuestion.text).toBeDefined();
      expect(typeof body.completionPercent).toBe('number');
    });

    it('returns subsequent question after first answer', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/public/fill/${fillToken}/next-question`,
        payload: { answersJson: { q1: 'Me sentindo bem' } },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      // Either next question or completed
      expect(body.nextQuestion !== undefined || body.reason !== undefined).toBe(true);
    });

    it('returns completed when all questions answered', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/public/fill/${fillToken}/next-question`,
        payload: { answersJson: { q1: 'Bem', q2: 8, q3: 'Sim' } },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.nextQuestion).toBeNull();
      expect(body.reason).toBe('completed');
      expect(body.completionPercent).toBe(100);
    });

    it('returns 404 for invalid token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/public/fill/invalid-token/next-question',
        payload: { answersJson: {} },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── POST /v1/public/fill/:token/answers ──────────────────────────────────

  describe('POST /v1/public/fill/:token/answers', () => {
    it('submits answers via public token → 200 or 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/public/fill/${fillToken}/answers`,
        payload: { answersJson: { q1: 'Resposta pública', q2: 7, q3: 'Sim' } },
      });
      expect([200, 201]).toContain(res.statusCode);
    });

    it('returns 404 for invalid token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/public/fill/invalid-token/answers',
        payload: { answersJson: { q1: 'X' } },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── POST /v1/public/fill/:token/sign ─────────────────────────────────────

  describe('POST /v1/public/fill/:token/sign', () => {
    it('signs the session with valid payload → 200', async () => {
      // Create a dedicated session for signing
      const sRes = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: authHeaders(ownerToken, tenantId),
        payload: { templateId },
      });
      const sId = sRes.json().id;
      const lRes = await app.inject({
        method: 'POST',
        url: `/v1/anamnesis/sessions/${sId}/fill-link`,
        headers: authHeaders(ownerToken, tenantId),
      });
      const token = lRes.json().fillToken;

      // Submit answers first
      await app.inject({
        method: 'POST',
        url: `/v1/public/fill/${token}/answers`,
        payload: { answersJson: { q1: 'Test', q2: 5, q3: 'Não' } },
      });

      // Sign
      const res = await app.inject({
        method: 'POST',
        url: `/v1/public/fill/${token}/sign`,
        payload: { signerName: 'Paciente Teste', agreed: true },
      });
      expect([200, 201]).toContain(res.statusCode);
    });

    it('returns 400/422 when agreed is false', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/public/fill/${fillToken}/sign`,
        payload: { signerName: 'Alguém', agreed: false },
      });
      expect([400, 422]).toContain(res.statusCode);
    });

    it('returns 400/422 when signerName is too short', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/public/fill/${fillToken}/sign`,
        payload: { signerName: 'A', agreed: true },
      });
      expect([400, 422]).toContain(res.statusCode);
    });

    it('returns 404 for invalid token', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/public/fill/invalid-token/sign',
        payload: { signerName: 'Nome Valido', agreed: true },
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
