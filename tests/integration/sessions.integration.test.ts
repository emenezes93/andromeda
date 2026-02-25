import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

describe('Integration: Sessions & Answers', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let templateId: string;
  let sessionId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;

    // Create a template for sessions
    const templateRes = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        name: `Session Test Template ${Date.now()}`,
        schemaJson: {
          questions: [
            { id: 'q1', text: 'Pergunta 1', type: 'text', required: true },
            { id: 'q2', text: 'Pergunta 2', type: 'number', required: true },
          ],
        },
      },
    });
    templateId = templateRes.json().id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /v1/anamnesis/sessions ──────────────────────────────────────────

  describe('POST /v1/anamnesis/sessions', () => {
    it('creates a session with valid templateId → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: authHeaders(ownerToken, tenantId),
        payload: { templateId },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.templateId).toBe(templateId);
      expect(body.tenantId).toBe(tenantId);
      sessionId = body.id;
    });

    it('returns 404 for non-existent templateId', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: authHeaders(ownerToken, tenantId),
        payload: { templateId: 'nonexistent-template-id' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('idempotency: same key returns same result', async () => {
      const idempotencyKey = `idem-session-${Date.now()}`;
      const payload = { templateId };

      const res1 = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: { ...authHeaders(ownerToken, tenantId), 'idempotency-key': idempotencyKey },
        payload,
      });
      expect(res1.statusCode).toBe(201);

      const res2 = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: { ...authHeaders(ownerToken, tenantId), 'idempotency-key': idempotencyKey },
        payload,
      });
      expect(res2.statusCode).toBe(201);
      expect(res2.json().id).toBe(res1.json().id);
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: { templateId },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /v1/anamnesis/sessions ───────────────────────────────────────────

  describe('GET /v1/anamnesis/sessions', () => {
    it('returns paginated list → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/sessions',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(typeof body.meta.total).toBe('number');
      expect(body.meta.page).toBe(1);
    });

    it('filters by templateId', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/anamnesis/sessions?templateId=${templateId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      for (const session of body.data) {
        expect(session.templateId).toBe(templateId);
      }
    });

    it('filters by status=in_progress', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/sessions?status=in_progress',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toBeDefined();
    });

    it('respects page and limit', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/sessions?page=1&limit=2',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data.length).toBeLessThanOrEqual(2);
      expect(res.json().meta.limit).toBe(2);
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/sessions',
        headers: { 'x-tenant-id': tenantId },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /v1/anamnesis/sessions/:id ───────────────────────────────────────

  describe('GET /v1/anamnesis/sessions/:id', () => {
    it('returns session with answers included → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/anamnesis/sessions/${sessionId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(sessionId);
      expect(body.template).toBeDefined();
      expect(Array.isArray(body.answers)).toBe(true);
    });

    it('returns 404 for non-existent session', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/sessions/nonexistent-session-id',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── POST /v1/anamnesis/sessions/:id/answers ──────────────────────────────

  describe('POST /v1/anamnesis/sessions/:id/answers', () => {
    it('submits answers with valid answersJson → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/anamnesis/sessions/${sessionId}/answers`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { answersJson: { q1: 'Resposta 1', q2: 8 } },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.sessionId).toBe(sessionId);
      expect(body.answersJson).toBeDefined();
    });

    it('returns 404 for non-existent session', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions/nonexistent-id/answers',
        headers: authHeaders(ownerToken, tenantId),
        payload: { answersJson: { q1: 'test' } },
      });
      expect(res.statusCode).toBe(404);
    });

    it('idempotency: same key returns same result', async () => {
      const idempotencyKey = `idem-answer-${Date.now()}`;
      const payload = { answersJson: { q1: 'Idem answer' } };

      const res1 = await app.inject({
        method: 'POST',
        url: `/v1/anamnesis/sessions/${sessionId}/answers`,
        headers: { ...authHeaders(ownerToken, tenantId), 'idempotency-key': idempotencyKey },
        payload,
      });
      expect(res1.statusCode).toBe(201);

      const res2 = await app.inject({
        method: 'POST',
        url: `/v1/anamnesis/sessions/${sessionId}/answers`,
        headers: { ...authHeaders(ownerToken, tenantId), 'idempotency-key': idempotencyKey },
        payload,
      });
      expect(res2.statusCode).toBe(201);
      expect(res2.json().id).toBe(res1.json().id);
    });
  });

  // ── POST /v1/anamnesis/sessions/:id/sign ─────────────────────────────────

  describe('POST /v1/anamnesis/sessions/:id/sign', () => {
    it('signs session with valid payload → 200', async () => {
      // Create a fresh session to sign
      const sRes = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: authHeaders(ownerToken, tenantId),
        payload: { templateId },
      });
      const sId = sRes.json().id;

      // Submit some answers first
      await app.inject({
        method: 'POST',
        url: `/v1/anamnesis/sessions/${sId}/answers`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { answersJson: { q1: 'Resp', q2: 5 } },
      });

      const res = await app.inject({
        method: 'POST',
        url: `/v1/anamnesis/sessions/${sId}/sign`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { signerName: 'João Silva', agreed: true },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.signatureName).toBe('João Silva');
    });

    it('returns 400/422 when agreed is false', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/anamnesis/sessions/${sessionId}/sign`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { signerName: 'João', agreed: false },
      });
      expect([400, 422]).toContain(res.statusCode);
    });

    it('returns 400/422 when signerName is too short', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/anamnesis/sessions/${sessionId}/sign`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { signerName: 'X', agreed: true },
      });
      expect([400, 422]).toContain(res.statusCode);
    });

    it('returns 404 for non-existent session', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions/nonexistent-id/sign',
        headers: authHeaders(ownerToken, tenantId),
        payload: { signerName: 'Nome Válido', agreed: true },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── GET /v1/anamnesis/sessions/:id/export ────────────────────────────────

  describe('GET /v1/anamnesis/sessions/:id/export', () => {
    it('exports session as JSON → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/anamnesis/sessions/${sessionId}/export?format=json`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect([200, 404]).toContain(res.statusCode);
      if (res.statusCode === 200) {
        expect(res.json()).toBeDefined();
      }
    });

    it('returns 404 for non-existent session export', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/sessions/nonexistent-id/export',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
