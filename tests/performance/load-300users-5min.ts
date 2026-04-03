/**
 * Carga integrada (web + mobile) usando Fastify inject.
 * Cenário: 300 usuários concorrentes por 5 minutos.
 */
import { createTestApp, loginAsOwner, authHeaders, STRONG_PASSWORD } from '../helpers/index.js';
import type { FastifyInstance } from 'fastify';

type Channel = 'web' | 'mobile';

interface Action {
  name: string;
  expected: number[];
  run: () => Promise<number>;
}

interface EndpointMetrics {
  total: number;
  success: number;
  failure: number;
  latenciesMs: number[];
  statusCounts: Record<string, number>;
}

interface ChannelMetrics extends EndpointMetrics {
  endpoints: Record<string, EndpointMetrics>;
}

const VUS_TOTAL = 300;
const DURATION_MS = 5 * 60 * 1000;
const THINK_TIME_MIN_MS = 100;
const THINK_TIME_MAX_MS = 400;
const WEB_USERS = 150;
const MOBILE_USERS = 150;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function nowMs(): number {
  return Number(process.hrtime.bigint()) / 1_000_000;
}

function createEndpointMetrics(): EndpointMetrics {
  return {
    total: 0,
    success: 0,
    failure: 0,
    latenciesMs: [],
    statusCounts: {},
  };
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx];
}

function summarizeMetrics(label: string, m: EndpointMetrics): Record<string, string | number> {
  const availability = m.total > 0 ? (m.success / m.total) * 100 : 0;
  const avg = m.latenciesMs.length > 0 ? m.latenciesMs.reduce((a, b) => a + b, 0) / m.latenciesMs.length : 0;
  return {
    label,
    requests: m.total,
    success: m.success,
    failure: m.failure,
    availabilityPct: Number(availability.toFixed(2)),
    p50Ms: Number(percentile(m.latenciesMs, 50).toFixed(2)),
    p95Ms: Number(percentile(m.latenciesMs, 95).toFixed(2)),
    p99Ms: Number(percentile(m.latenciesMs, 99).toFixed(2)),
    avgMs: Number(avg.toFixed(2)),
  };
}

async function setupActors(app: FastifyInstance): Promise<{
  tenantId: string;
  webToken: string;
  mobileToken: string;
  mobileEmail: string;
}> {
  const owner = await loginAsOwner(app);
  const tenantId = owner.tenantId;

  const patientEmail = `load-mobile-${Date.now()}@test.com`;
  const registerRes = await app.inject({
    method: 'POST',
    url: '/v1/patient-portal/register',
    payload: {
      email: patientEmail,
      password: STRONG_PASSWORD,
      fullName: `Load Mobile ${Date.now()}`,
      tenantId,
    },
  });
  if (registerRes.statusCode !== 201) {
    throw new Error(`patient register failed: ${registerRes.statusCode} ${registerRes.body}`);
  }

  const loginRes = await app.inject({
    method: 'POST',
    url: '/v1/patient-portal/login',
    headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
    payload: { email: patientEmail, password: STRONG_PASSWORD },
  });
  if (loginRes.statusCode !== 200) {
    throw new Error(`patient login failed: ${loginRes.statusCode} ${loginRes.body}`);
  }
  const loginBody = loginRes.json();
  return {
    tenantId,
    webToken: owner.token,
    mobileToken: loginBody.token as string,
    mobileEmail: patientEmail,
  };
}

function pickAction(actions: Action[]): Action {
  return actions[Math.floor(Math.random() * actions.length)];
}

function track(
  channelMetrics: ChannelMetrics,
  endpointName: string,
  statusCode: number,
  latencyMs: number,
  expected: number[]
): void {
  const ok = expected.includes(statusCode);
  channelMetrics.total++;
  channelMetrics.latenciesMs.push(latencyMs);
  if (ok) channelMetrics.success++;
  else channelMetrics.failure++;
  channelMetrics.statusCounts[String(statusCode)] = (channelMetrics.statusCounts[String(statusCode)] ?? 0) + 1;

  const endpointMetrics = channelMetrics.endpoints[endpointName] ?? createEndpointMetrics();
  endpointMetrics.total++;
  endpointMetrics.latenciesMs.push(latencyMs);
  if (ok) endpointMetrics.success++;
  else endpointMetrics.failure++;
  endpointMetrics.statusCounts[String(statusCode)] = (endpointMetrics.statusCounts[String(statusCode)] ?? 0) + 1;
  channelMetrics.endpoints[endpointName] = endpointMetrics;
}

async function worker(
  channel: Channel,
  endAt: number,
  actions: Action[],
  channelMetrics: ChannelMetrics
): Promise<void> {
  while (Date.now() < endAt) {
    const action = pickAction(actions);
    const start = nowMs();
    try {
      const status = await action.run();
      track(channelMetrics, action.name, status, nowMs() - start, action.expected);
    } catch {
      track(channelMetrics, action.name, 0, nowMs() - start, action.expected);
    }
    await sleep(randomInt(THINK_TIME_MIN_MS, THINK_TIME_MAX_MS));
  }
}

async function main(): Promise<void> {
  const app = await createTestApp();
  app.log.level = 'silent';
  const webMetrics: ChannelMetrics = { ...createEndpointMetrics(), endpoints: {} };
  const mobileMetrics: ChannelMetrics = { ...createEndpointMetrics(), endpoints: {} };
  const globalStart = Date.now();

  try {
    const { tenantId, webToken, mobileToken, mobileEmail } = await setupActors(app);
    const webHeaders = authHeaders(webToken, tenantId);
    const mobileHeaders = authHeaders(mobileToken, tenantId);
    const today = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();

    const webActions: Action[] = [
      {
        name: 'GET /health',
        expected: [200],
        run: async () => (await app.inject({ method: 'GET', url: '/health' })).statusCode,
      },
      {
        name: 'GET /v1/patients?limit=10',
        expected: [200],
        run: async () =>
          (
            await app.inject({
              method: 'GET',
              url: '/v1/patients?limit=10',
              headers: webHeaders,
            })
          ).statusCode,
      },
      {
        name: 'GET /v1/training-plans?limit=10',
        expected: [200],
        run: async () =>
          (
            await app.inject({
              method: 'GET',
              url: '/v1/training-plans?limit=10',
              headers: webHeaders,
            })
          ).statusCode,
      },
      {
        name: 'GET /v1/stats/dashboard?days=30',
        expected: [200],
        run: async () =>
          (
            await app.inject({
              method: 'GET',
              url: '/v1/stats/dashboard?days=30',
              headers: webHeaders,
            })
          ).statusCode,
      },
      {
        name: 'GET /v1/goals?limit=10',
        expected: [200],
        run: async () =>
          (
            await app.inject({
              method: 'GET',
              url: '/v1/goals?limit=10',
              headers: webHeaders,
            })
          ).statusCode,
      },
    ];

    const mobileActions: Action[] = [
      {
        name: 'POST /v1/patient-portal/login',
        expected: [200],
        run: async () =>
          (
            await app.inject({
              method: 'POST',
              url: '/v1/patient-portal/login',
              headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
              payload: {
                email: `load-mobile-${globalStart}@invalid.test`,
                password: STRONG_PASSWORD,
              },
            })
          ).statusCode,
      },
      {
        name: 'GET /v1/patient-portal/me',
        expected: [200],
        run: async () =>
          (
            await app.inject({
              method: 'GET',
              url: '/v1/patient-portal/me',
              headers: mobileHeaders,
            })
          ).statusCode,
      },
      {
        name: 'GET /v1/patient-portal/my-training-plans?limit=10',
        expected: [200],
        run: async () =>
          (
            await app.inject({
              method: 'GET',
              url: '/v1/patient-portal/my-training-plans?limit=10',
              headers: mobileHeaders,
            })
          ).statusCode,
      },
      {
        name: 'POST /v1/patient-portal/my-weight-logs',
        expected: [201],
        run: async () =>
          (
            await app.inject({
              method: 'POST',
              url: '/v1/patient-portal/my-weight-logs',
              headers: mobileHeaders,
              payload: { date: today, valueKg: 70 + Math.random() * 10 },
            })
          ).statusCode,
      },
      {
        name: 'POST /v1/patient-portal/my-water-logs',
        expected: [201],
        run: async () =>
          (
            await app.inject({
              method: 'POST',
              url: '/v1/patient-portal/my-water-logs',
              headers: mobileHeaders,
              payload: { date: today, ml: randomInt(150, 500) },
            })
          ).statusCode,
      },
      {
        name: 'POST /v1/patient-portal/my-meal-logs',
        expected: [201],
        run: async () =>
          (
            await app.inject({
              method: 'POST',
              url: '/v1/patient-portal/my-meal-logs',
              headers: mobileHeaders,
              payload: {
                date: today,
                time: '12:30',
                name: `Load meal ${nowIso}`,
                kcal: randomInt(200, 650),
                proteinG: randomInt(15, 45),
                carbsG: randomInt(20, 80),
                fatG: randomInt(5, 30),
              },
            })
          ).statusCode,
      },
    ];

    // Replace mobile login action with valid credentials after actor setup.
    const validMobileLogin = {
      name: 'POST /v1/patient-portal/login',
      expected: [200],
      run: async () =>
        (
          await app.inject({
            method: 'POST',
            url: '/v1/patient-portal/login',
            headers: { 'x-tenant-id': tenantId, 'content-type': 'application/json' },
            payload: {
              email: mobileEmail,
              password: STRONG_PASSWORD,
            },
          })
        ).statusCode,
    };
    mobileActions[0] = validMobileLogin;

    const endAt = Date.now() + DURATION_MS;
    const workers: Array<Promise<void>> = [];

    for (let i = 0; i < WEB_USERS; i++) {
      workers.push(worker('web', endAt, webActions, webMetrics));
    }
    for (let i = 0; i < MOBILE_USERS; i++) {
      workers.push(worker('mobile', endAt, mobileActions, mobileMetrics));
    }

    await Promise.all(workers);

    const durationSec = (Date.now() - globalStart) / 1000;
    const totalReq = webMetrics.total + mobileMetrics.total;
    const totalSucc = webMetrics.success + mobileMetrics.success;
    const totalAvailability = totalReq > 0 ? (totalSucc / totalReq) * 100 : 0;

    const summary = [
      summarizeMetrics('WEB', webMetrics),
      summarizeMetrics('MOBILE', mobileMetrics),
      summarizeMetrics('TOTAL', {
        total: totalReq,
        success: totalSucc,
        failure: webMetrics.failure + mobileMetrics.failure,
        latenciesMs: [...webMetrics.latenciesMs, ...mobileMetrics.latenciesMs],
        statusCounts: { ...webMetrics.statusCounts, ...mobileMetrics.statusCounts },
      }),
    ];

    console.log('\n=== LOAD TEST SUMMARY (300 users / 5 min) ===');
    console.table(summary);
    console.log(`Duration(s): ${durationSec.toFixed(2)}`);
    console.log(`Total requests: ${totalReq}`);
    console.log(`Availability total (%): ${totalAvailability.toFixed(2)}`);

    console.log('\n=== TOP ENDPOINTS WEB ===');
    console.table(
      Object.entries(webMetrics.endpoints)
        .map(([k, v]) => summarizeMetrics(k, v))
        .sort((a, b) => Number(b.requests) - Number(a.requests))
        .slice(0, 10)
    );

    console.log('\n=== TOP ENDPOINTS MOBILE ===');
    console.table(
      Object.entries(mobileMetrics.endpoints)
        .map(([k, v]) => summarizeMetrics(k, v))
        .sort((a, b) => Number(b.requests) - Number(a.requests))
        .slice(0, 10)
    );
  } finally {
    await app.close();
  }
}

void main();
