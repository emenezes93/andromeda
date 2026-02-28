import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestApp, loginAsOwner, authHeaders } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

/**
 * Integration tests for:
 *   - CRUD /v1/patients
 *   - CRUD /v1/anamnesis/templates
 *   - CRUD /v1/anamnesis/sessions
 *   - CRUD /v1/goals
 */

// ============================================================================
// Shared test data
// ============================================================================

const VALID_TEMPLATE_SCHEMA = {
  questions: [
    {
      id: 'q1',
      text: 'Como você está se sentindo?',
      type: 'single',
      options: ['Bem', 'Regular', 'Mal'],
      required: true,
      tags: ['wellbeing'],
    },
    {
      id: 'q2',
      text: 'Quantas horas dormiu?',
      type: 'number',
      required: false,
      tags: ['sleep'],
    },
  ],
};

// ============================================================================
// Integration: Patients
// ============================================================================

describe('Integration: Patients', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let patientId: string;

  const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /v1/patients ──────────────────────────────────────────────────

  describe('POST /v1/patients', () => {
    it('creates a patient with required fields → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          fullName: `João da Silva ${unique()}`,
          email: `joao-${unique()}@test.com`,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.fullName).toContain('João da Silva');
      patientId = body.id;
    });

    it('creates a patient with all optional fields → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          fullName: `Maria Souza ${unique()}`,
          email: `maria-${unique()}@test.com`,
          gender: 'F',
          phone: '11999999999',
          profession: 'Nutricionista',
          mainGoal: 'Perda de peso',
          mainComplaint: 'Fadiga',
          notes: 'Paciente comprometida.',
          birthDate: '1990-05-15',
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.gender).toBe('F');
      expect(body.profession).toBe('Nutricionista');
    });

    it('rejects missing fullName → 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: authHeaders(ownerToken, tenantId),
        payload: { email: `no-name-${unique()}@test.com` },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects unauthenticated requests → 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: { fullName: 'Ghost Patient' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /v1/patients ───────────────────────────────────────────────────

  describe('GET /v1/patients', () => {
    it('returns paginated list → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/patients?page=1&limit=5',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
      expect(typeof body.meta.total).toBe('number');
    });

    it('supports search filter → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/patients?search=João`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json().data)).toBe(true);
    });
  });

  // ── GET /v1/patients/:id ───────────────────────────────────────────────

  describe('GET /v1/patients/:id', () => {
    it('returns the patient by id → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/patients/${patientId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().id).toBe(patientId);
    });

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/patients/00000000-0000-0000-0000-000000000000',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── PATCH /v1/patients/:id ─────────────────────────────────────────────

  describe('PATCH /v1/patients/:id', () => {
    it('updates patient fields → 200', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/patients/${patientId}`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { notes: 'Nota atualizada pela integração.' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().notes).toBe('Nota atualizada pela integração.');
    });
  });

  // ── DELETE /v1/patients/:id ────────────────────────────────────────────

  describe('DELETE /v1/patients/:id', () => {
    it('soft-deletes the patient → 200 or 204', async () => {
      // Create a throwaway patient to delete
      const created = await app.inject({
        method: 'POST',
        url: '/v1/patients',
        headers: authHeaders(ownerToken, tenantId),
        payload: { fullName: `Deletable ${unique()}` },
      });
      const toDelete = created.json().id;

      const res = await app.inject({
        method: 'DELETE',
        url: `/v1/patients/${toDelete}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect([200, 204]).toContain(res.statusCode);

      // Should no longer be accessible
      const check = await app.inject({
        method: 'GET',
        url: `/v1/patients/${toDelete}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(check.statusCode).toBe(404);
    });
  });
});

// ============================================================================
// Integration: Templates
// ============================================================================

describe('Integration: Templates', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let templateId: string;

  const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /v1/anamnesis/templates ───────────────────────────────────────

  describe('POST /v1/anamnesis/templates', () => {
    it('creates template with valid schema → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          name: `Template Integração ${unique()}`,
          schemaJson: VALID_TEMPLATE_SCHEMA,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.name).toContain('Template Integração');
      expect(body.version).toBe(1);
      templateId = body.id;
    });

    it('rejects missing name → 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: authHeaders(ownerToken, tenantId),
        payload: { schemaJson: VALID_TEMPLATE_SCHEMA },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects missing schemaJson → 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: `No Schema ${unique()}` },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects unauthenticated → 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: { name: 'Ghost Template', schemaJson: VALID_TEMPLATE_SCHEMA },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /v1/anamnesis/templates ────────────────────────────────────────

  describe('GET /v1/anamnesis/templates', () => {
    it('returns paginated list → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/templates?page=1&limit=10',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta.total).toBeGreaterThanOrEqual(1);
    });
  });

  // ── GET /v1/anamnesis/templates/:id ───────────────────────────────────

  describe('GET /v1/anamnesis/templates/:id', () => {
    it('returns template by id → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/anamnesis/templates/${templateId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().id).toBe(templateId);
    });

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/templates/00000000-0000-0000-0000-000000000000',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── PATCH /v1/anamnesis/templates/:id ─────────────────────────────────

  describe('PATCH /v1/anamnesis/templates/:id', () => {
    it('updates template name → 200', async () => {
      const newName = `Template Atualizado ${unique()}`;
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/anamnesis/templates/${templateId}`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: newName },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().name).toBe(newName);
    });

    it('returns 404 for unknown template id', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: '/v1/anamnesis/templates/00000000-0000-0000-0000-000000000000',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: 'Ghost' },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── DELETE /v1/anamnesis/templates/:id ────────────────────────────────

  describe('DELETE /v1/anamnesis/templates/:id', () => {
    it('deletes template → 200 or 204', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/templates',
        headers: authHeaders(ownerToken, tenantId),
        payload: { name: `Deletable Template ${unique()}`, schemaJson: VALID_TEMPLATE_SCHEMA },
      });
      const toDelete = created.json().id;

      const res = await app.inject({
        method: 'DELETE',
        url: `/v1/anamnesis/templates/${toDelete}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect([200, 204]).toContain(res.statusCode);

      // Verify deletion
      const check = await app.inject({
        method: 'GET',
        url: `/v1/anamnesis/templates/${toDelete}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(check.statusCode).toBe(404);
    });
  });
});

// ============================================================================
// Integration: Sessions
// ============================================================================

describe('Integration: Sessions', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let templateId: string;
  let patientId: string;
  let sessionId: string;

  const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;

    // Create prerequisite template
    const tmpl = await app.inject({
      method: 'POST',
      url: '/v1/anamnesis/templates',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        name: `Session Test Template ${unique()}`,
        schemaJson: VALID_TEMPLATE_SCHEMA,
      },
    });
    templateId = tmpl.json().id;

    // Create prerequisite patient
    const patient = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
      payload: { fullName: `Session Patient ${unique()}`, email: `sess-${unique()}@test.com` },
    });
    patientId = patient.json().id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /v1/anamnesis/sessions ────────────────────────────────────────

  describe('POST /v1/anamnesis/sessions', () => {
    it('creates session with templateId + patientId → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: authHeaders(ownerToken, tenantId),
        payload: { templateId, patientId },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.templateId).toBe(templateId);
      expect(body.patientId).toBe(patientId);
      sessionId = body.id;
    });

    it('creates session without patientId (anonymous) → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: authHeaders(ownerToken, tenantId),
        payload: { templateId },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().patientId).toBeNull();
    });

    it('rejects missing templateId → 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: authHeaders(ownerToken, tenantId),
        payload: { patientId },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid templateId → 404', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: authHeaders(ownerToken, tenantId),
        payload: { templateId: '00000000-0000-0000-0000-000000000000' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('rejects unauthenticated → 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/anamnesis/sessions',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: { templateId },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /v1/anamnesis/sessions ─────────────────────────────────────────

  describe('GET /v1/anamnesis/sessions', () => {
    it('returns paginated list → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/sessions?page=1&limit=10',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.meta).toBeDefined();
    });

    it('filters by patientId → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/anamnesis/sessions?patientId=${patientId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const sessions = res.json().data as Array<{ patientId: string }>;
      sessions.forEach((s) => expect(s.patientId).toBe(patientId));
    });

    it('filters by status → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/sessions?status=in_progress',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json().data)).toBe(true);
    });

    it('filters by templateId → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/anamnesis/sessions?templateId=${templateId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const sessions = res.json().data as Array<{ templateId: string }>;
      sessions.forEach((s) => expect(s.templateId).toBe(templateId));
    });
  });

  // ── GET /v1/anamnesis/sessions/:id ────────────────────────────────────

  describe('GET /v1/anamnesis/sessions/:id', () => {
    it('returns session by id → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/anamnesis/sessions/${sessionId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().id).toBe(sessionId);
    });

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/anamnesis/sessions/00000000-0000-0000-0000-000000000000',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── POST /v1/anamnesis/sessions/:id/answers ────────────────────────────

  describe('POST /v1/anamnesis/sessions/:id/answers', () => {
    it('submits answers to session → 200 or 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/v1/anamnesis/sessions/${sessionId}/answers`,
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          answers: { q1: 'Bem', q2: 7 },
        },
      });
      expect([200, 201]).toContain(res.statusCode);
    });
  });
});

// ============================================================================
// Integration: Goals
// ============================================================================

describe('Integration: Goals', () => {
  let app: FastifyInstance;
  let ownerToken: string;
  let tenantId: string;
  let patientId: string;
  let goalId: string;

  const unique = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const startDate = new Date().toISOString().split('T')[0];
  const targetDate = new Date(Date.now() + 90 * 86400_000).toISOString().split('T')[0];

  beforeAll(async () => {
    app = await createTestApp();
    const login = await loginAsOwner(app);
    ownerToken = login.token;
    tenantId = login.tenantId;

    const patient = await app.inject({
      method: 'POST',
      url: '/v1/patients',
      headers: authHeaders(ownerToken, tenantId),
      payload: { fullName: `Goal Patient ${unique()}`, email: `goal-${unique()}@test.com` },
    });
    patientId = patient.json().id;
  });

  afterAll(async () => {
    await app.close();
  });

  // ── POST /v1/goals ─────────────────────────────────────────────────────

  describe('POST /v1/goals', () => {
    it('creates goal with required fields → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          type: 'weight_loss',
          title: 'Perder 5 kg',
          targetValue: 80,
          unit: 'kg',
          startDate,
          targetDate,
        },
      });
      expect(res.statusCode).toBe(201);
      const body = res.json();
      expect(body.id).toBeDefined();
      expect(body.title).toBe('Perder 5 kg');
      expect(body.achievedAt).toBeNull();
      goalId = body.id;
    });

    it('creates goal with all optional fields → 201', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          type: 'performance',
          title: 'Correr 5 km',
          description: 'Meta de corrida',
          currentValue: 2.5,
          targetValue: 5,
          unit: 'km',
          startDate,
          targetDate,
        },
      });
      expect(res.statusCode).toBe(201);
      expect(res.json().currentValue).toBe(2.5);
    });

    it('rejects invalid patientId → 404', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId: '00000000-0000-0000-0000-000000000000',
          type: 'health',
          title: 'Ghost Goal',
          targetValue: 10,
          unit: 'steps',
          startDate,
          targetDate,
        },
      });
      expect(res.statusCode).toBe(404);
    });

    it('rejects targetDate before startDate → 400', async () => {
      const yesterday = new Date(Date.now() - 86400_000).toISOString().split('T')[0];
      const res = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          type: 'health',
          title: 'Bad Dates',
          targetValue: 10,
          unit: 'kg',
          startDate,
          targetDate: yesterday,
        },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects missing required fields → 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: authHeaders(ownerToken, tenantId),
        payload: { patientId, title: 'Incomplete Goal' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects unauthenticated → 401', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
        payload: { patientId, type: 'health', title: 'Ghost', targetValue: 5, unit: 'kg', startDate, targetDate },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  // ── GET /v1/goals ──────────────────────────────────────────────────────

  describe('GET /v1/goals', () => {
    it('returns paginated list → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/goals?page=1&limit=10',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(Array.isArray(body.data)).toBe(true);
      expect(typeof body.meta.total).toBe('number');
    });

    it('filters by patientId → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/goals?patientId=${patientId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const goals = res.json().data as Array<{ patientId: string }>;
      goals.forEach((g) => expect(g.patientId).toBe(patientId));
    });

    it('filters by achieved=false → 200 (only active goals)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/goals?achieved=false&patientId=${patientId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      const goals = res.json().data as Array<{ achievedAt: string | null }>;
      goals.forEach((g) => expect(g.achievedAt).toBeNull());
    });
  });

  // ── GET /v1/goals/:id ──────────────────────────────────────────────────

  describe('GET /v1/goals/:id', () => {
    it('returns goal by id → 200', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/v1/goals/${goalId}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().id).toBe(goalId);
    });

    it('returns 404 for unknown id', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/v1/goals/00000000-0000-0000-0000-000000000000',
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(res.statusCode).toBe(404);
    });
  });

  // ── PATCH /v1/goals/:id ────────────────────────────────────────────────

  describe('PATCH /v1/goals/:id', () => {
    it('updates goal fields → 200', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/goals/${goalId}`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { currentValue: 77.5, title: 'Perder 5 kg — atualizado' },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.currentValue).toBe(77.5);
      expect(body.title).toBe('Perder 5 kg — atualizado');
    });

    it('marks goal as achieved → 200', async () => {
      const achievedAt = new Date().toISOString();
      const res = await app.inject({
        method: 'PATCH',
        url: `/v1/goals/${goalId}`,
        headers: authHeaders(ownerToken, tenantId),
        payload: { achievedAt },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().achievedAt).toBeDefined();
    });
  });

  // ── DELETE /v1/goals/:id ───────────────────────────────────────────────

  describe('DELETE /v1/goals/:id', () => {
    it('deletes goal → 200 or 204', async () => {
      const created = await app.inject({
        method: 'POST',
        url: '/v1/goals',
        headers: authHeaders(ownerToken, tenantId),
        payload: {
          patientId,
          type: 'health',
          title: 'Deletable Goal',
          targetValue: 1,
          unit: 'unit',
          startDate,
          targetDate,
        },
      });
      const toDelete = created.json().id;

      const res = await app.inject({
        method: 'DELETE',
        url: `/v1/goals/${toDelete}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect([200, 204]).toContain(res.statusCode);

      const check = await app.inject({
        method: 'GET',
        url: `/v1/goals/${toDelete}`,
        headers: authHeaders(ownerToken, tenantId),
      });
      expect(check.statusCode).toBe(404);
    });
  });
});
