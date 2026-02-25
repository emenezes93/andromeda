import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

const validSchemaJson = {
  questions: [
    { id: 'q1', text: 'Question 1', type: 'text', required: true, tags: ['sleep'] },
    { id: 'q2', text: 'Question 2', type: 'number', required: false },
  ],
};

describe('Integration: Templates', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let createdTemplateId: string;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /v1/anamnesis/templates ─────────────────────────────────────────

  describe('POST /v1/anamnesis/templates', () => {
    it('creates a template with valid schemaJson → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: `Template ${Date.now()}`, schemaJson: validSchemaJson },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.name).toContain('Template');
      expect(body.tenantId).toBe(tenantId);
      createdTemplateId = body.id;
    });

    it('returns 400/422 for schemaJson without questions', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: 'Bad Template', schemaJson: {} },
      });
      expect([400, 422]).toContain(res.statusCode);
    });

    it('returns 400/422 for missing name', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: authHeaders(ownerToken, tenantId),
        payload: { schemaJson: validSchemaJson },
      });
      expect([400, 422]).toContain(res.statusCode);
    });

    it('returns 401 without auth', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: { name: 'No Auth', schemaJson: validSchemaJson },
      });
      expect(res.statusCode).toBe(401);
    });

    it('returns 403 for viewer role', async () => {
      const viewerEmail = `viewer-tpl-${Date.now()}@test.com`;
      await app.inject({
        method: 'POST',
        url: '/v1/users',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email: viewerEmail, password: STRONG_PASSWORD, role: 'viewer' },
      });
      const loginRes = await app.inject({
        method: 'POST',
        url: '/v1/auth/login',
        payload: { email: viewerEmail, password: STRONG_PASSWORD },
      });
      if (loginRes.statusCode !== 200) return;
      const viewerToken = loginRes.json().token;

      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: authHeaders(viewerToken, tenantId),
        payload: { name: 'Viewer template', schemaJson: validSchemaJson },
      });
      expect(res.statusCode).toBe(403);
    });

    it('idempotency: same key returns same result', async () => {
      const idempotencyKey = `idem-template-${Date.now()}`;
      const payload = { name: `Idempotent Template ${Date.now()}`, schemaJson: validSchemaJson };

      const res1 = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: { ...authHeaders(ownerToken, tenantId), 'idempotency-key': idempotencyKey },
        payload,
      });
      expect(res1.statusCode).toBe(201);

      const res2 = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: { ...authHeaders(ownerToken, tenantId), 'idempotency-key': idempotencyKey },
        payload,
      });
      expect(res2.statusCode).toBe(201);
      expect(res2.json().id).toBe(res1.json().id);
    });
  });

  // ── GET /v1/anamnesis/templates/:id ──────────────────────────────────────

  describe('GET /v1/anamnesis/templates/:id', () => {
    it('returns template by ID → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/anamnesis/templates/${createdTemplateId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.id).toBe(createdTemplateId);
      expect(body.schemaJson).toBeDefined();
    });

    it('returns 404 for non-existent template', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/templates/nonexistent-id',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── GET /v1/anamnesis/templates ───────────────────────────────────────────

  describe('GET /v1/anamnesis/templates', () => {
    it('lists templates with pagination → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/templates?page=1&limit=5',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta.page).toBe(1);
      expect(body.meta.limit).toBe(5);
      expect(typeof body.meta.total).toBe('number');
      expect(typeof body.meta.totalPages).toBe('number');
    });

    it('returns empty data for high page number', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/templates?page=999&limit=5',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().data).toHaveLength(0);
    });
  });

  // ── PATCH /v1/anamnesis/templates/:id ────────────────────────────────────

  describe('PATCH /v1/anamnesis/templates/:id', () => {
    it('updates template name → 200', async () => {
      const updatedName = `Updated Template ${Date.now()}`;
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/anamnesis/templates/${createdTemplateId}`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: updatedName },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.name).toBe(updatedName);
      expect(body.id).toBe(createdTemplateId);
    });

    it('updates schemaJson → 200', async () => {
      const newSchema = {
        questions: [
          { id: 'q1', text: 'Nova pergunta', type: 'text', required: true },
        ],
      };
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/anamnesis/templates/${createdTemplateId}`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { schemaJson: newSchema },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().schemaJson).toBeDefined();
    });

    it('returns 404 for non-existent template', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/anamnesis/templates/nonexistent-id',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: 'X' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── DELETE /v1/anamnesis/templates/:id ────────────────────────────────────

  describe('DELETE /v1/anamnesis/templates/:id', () => {
    it('soft-deletes template → 204', async () => {
      // Create a fresh template to delete
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: `To Delete ${Date.now()}`, schemaJson: validSchemaJson },
      });
      const idToDelete = createRes.json().id;

      const deleteRes = await app.inject({
        method: 'DELETE',
        url: `/v1/anamnesis/templates/${idToDelete}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(deleteRes.statusCode).toBe(204);
    });

    it('returns 404 after deletion', async () => {
      const createRes = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: `Delete Then Get ${Date.now()}`, schemaJson: validSchemaJson },
      });
      const id = createRes.json().id;

      await app.inject({
        method: 'DELETE',
        url: `/v1/anamnesis/templates/${id}`,
        headers: authHeaders(ownerToken, tenantId),
      });

      const getRes = await app.inject({
        method: 'GET',
        url: `/v1/anamnesis/templates/${id}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(getRes.statusCode).toBe(404);
    });

    it('returns 404 for non-existent template', async () => {
      const res = await app.inject({
        method: 'DELETE',
        url: '/v1/anamnesis/templates/nonexistent-id',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });
});
