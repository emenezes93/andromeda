import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
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

  describe('GET /v1/anamnesis/templates', () => {
    it('lists templates with pagination → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/templates?page=1&limit=5',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.data).toBeDefined();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
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
      const body = res.json();
      expect(body.data).toHaveLength(0);
    });
  });
});
