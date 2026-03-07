/**
 * Integration tests for PatientNotification + patient-portal my-notifications.
 * - P1: Creating/updating TrainingPlan or DietPlan creates PatientNotification.
 * - P2: GET /v1/patient-portal/me returns hasUnreadNotifications.
 * - P4: GET my-notifications (paginated), PATCH mark-as-read.
 * Requires DB (run with npx vitest run tests/integration/patient-notifications.integration.test.ts).
 */
import { describe, it, expect, beforeAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';

let app: FastifyInstance;
let tenantId: string;
let ownerToken: string;
let patientId: string;

beforeAll(async () => {
  app = await createTestApp();
  const owner = await loginAsOwner(app);
  ownerToken = owner.token;
  tenantId = owner.tenantId;

  const patientRes = await app.inject({
    method: 'POST',
    url: '/v1/patients',
    headers: authHeaders(ownerToken, tenantId),
    payload: { fullName: 'Paciente Notif Test', email: `notif-${Date.now()}@test.com` },
  });
  expect(patientRes.statusCode).toBe(201);
  patientId = patientRes.json().id;
});

describe('PatientNotification (P1) — plan_assigned on create/update', () => {
  it('creates one PatientNotification when creating a training plan', async () => {
    const startDate = new Date().toISOString().slice(0, 10);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/training-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: {
        patientId,
        name: 'Plano Notif',
        planJson: {},
        startDate,
      },
    });
    expect(res.statusCode).toBe(201);

    const notifications = await app.prisma.patientNotification.findMany({
      where: { tenantId, patientId, type: 'training_plan_assigned' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    expect(notifications.length).toBe(1);
    expect(notifications[0].metadata).toBeDefined();
    const meta = notifications[0].metadata as Record<string, unknown>;
    expect(meta.planType).toBe('training');
    expect(meta.planId).toBeDefined();
  });

  it('creates one PatientNotification when creating a diet plan', async () => {
    const startDate = new Date().toISOString().slice(0, 10);
    const res = await app.inject({
      method: 'POST',
      url: '/v1/diet-plans',
      headers: authHeaders(ownerToken, tenantId),
      payload: { patientId, name: 'Dieta Notif', startDate },
    });
    expect(res.statusCode).toBe(201);

    const notifications = await app.prisma.patientNotification.findMany({
      where: { tenantId, patientId, type: 'diet_plan_assigned' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    expect(notifications.length).toBe(1);
  });
});

describe('Patient portal /me and my-notifications (P2, P4)', () => {
  it('GET /v1/patient-portal/me returns hasUnreadNotifications', async () => {
    const registerRes = await app.inject({
      method: 'POST',
      url: '/v1/patient-portal/register',
      payload: {
        email: `me-notif-${Date.now()}@test.com`,
        password: STRONG_PASSWORD,
        fullName: 'Me Notif',
        tenantId,
      },
    });
    expect(registerRes.statusCode).toBe(201);
    const patient2Id = registerRes.json().id;

    await app.prisma.patientNotification.create({
      data: {
        tenantId,
        patientId: patient2Id,
        type: 'plan_assigned',
        metadata: {},
      },
    });

    const loginRes = await app.inject({
      method: 'POST',
      url: '/v1/patient-portal/login',
      headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
      payload: {
        email: registerRes.json().email,
        password: STRONG_PASSWORD,
      },
    });
    expect(loginRes.statusCode).toBe(200);
    const patientToken = loginRes.json().token;

    const meRes = await app.inject({
      method: 'GET',
      url: '/v1/patient-portal/me',
      headers: {
        authorization: `Bearer ${patientToken}`,
        'x-tenant-id': tenantId,
      },
    });
    expect(meRes.statusCode).toBe(200);
    const me = meRes.json();
    expect(typeof me.hasUnreadNotifications).toBe('boolean');
    expect(me.hasUnreadNotifications).toBe(true);

    const listRes = await app.inject({
      method: 'GET',
      url: '/v1/patient-portal/my-notifications?page=1&limit=10',
      headers: {
        authorization: `Bearer ${patientToken}`,
        'x-tenant-id': tenantId,
      },
    });
    expect(listRes.statusCode).toBe(200);
    const list = listRes.json();
    expect(Array.isArray(list.data)).toBe(true);
    expect(list.meta.total).toBeGreaterThanOrEqual(1);
    const firstId = list.data[0].id;

    const markRes = await app.inject({
      method: 'PATCH',
      url: '/v1/patient-portal/my-notifications/mark-as-read',
      headers: {
        authorization: `Bearer ${patientToken}`,
        'x-tenant-id': tenantId,
        'content-type': 'application/json',
      },
      payload: { ids: [firstId] },
    });
    expect(markRes.statusCode).toBe(200);
    expect(markRes.json().updated).toBe(1);

    const me2Res = await app.inject({
      method: 'GET',
      url: '/v1/patient-portal/me',
      headers: {
        authorization: `Bearer ${patientToken}`,
        'x-tenant-id': tenantId,
      },
    });
    expect(me2Res.statusCode).toBe(200);
    const me2 = me2Res.json();
    expect(me2.hasUnreadNotifications).toBe(false);
  });
});
