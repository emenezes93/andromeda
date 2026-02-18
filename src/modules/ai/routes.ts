import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError } from '@shared/errors/index.js';
import { env } from '@config/env.js';
import { generateInsights } from './service.js';
import type { TemplateSchemaJson } from '@shared/types/index.js';
import { getIdempotencyKey, getRequestHash, withIdempotency } from '@shared/utils/idempotency.js';

const insightsBodySchema = z.object({ sessionId: z.string() });

const DEFAULT_RISKS = { readiness: 50, dropoutRisk: 30, stress: 50, sleepQuality: 50 };

function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 50;
}

/** Normalize risksJson so response always has readiness, dropoutRisk, stress, sleepQuality as numbers. */
function normalizeRisksJson(raw: unknown): Record<string, number> {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    readiness: toNum(o.readiness ?? DEFAULT_RISKS.readiness),
    dropoutRisk: toNum(o.dropoutRisk ?? o.dropout_risk ?? DEFAULT_RISKS.dropoutRisk),
    stress: toNum(o.stress ?? DEFAULT_RISKS.stress),
    sleepQuality: toNum(o.sleepQuality ?? o.sleep_quality ?? DEFAULT_RISKS.sleepQuality),
  };
}

/** Build a plain response object with normalized risksJson (safe for serialization). */
function toInsightResponse(insight: {
  id: string;
  sessionId: string;
  summary: string | null;
  risksJson: unknown;
  recommendationsJson: unknown;
  createdAt: Date;
}) {
  return {
    id: insight.id,
    sessionId: insight.sessionId,
    summary: insight.summary ?? '',
    risksJson: normalizeRisksJson(insight.risksJson),
    recommendationsJson: insight.recommendationsJson,
    createdAt: insight.createdAt,
  };
}

/** Try to create an insight; on unique constraint race, return existing record. */
async function createInsightSafe(
  prisma: FastifyInstance['prisma'],
  data: {
    tenantId: string;
    sessionId: string;
    summary: string;
    risksJson: object;
    recommendationsJson: object;
  }
) {
  try {
    return await prisma.aiInsight.create({ data });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2002'
    ) {
      const existing = await prisma.aiInsight.findUnique({
        where: { sessionId: data.sessionId },
      });
      if (existing) return existing;
    }
    throw err;
  }
}

export async function aiRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/v1/ai/insights',
    {
      config: { rateLimit: { max: env.RATE_LIMIT_AI, timeWindow: '1 minute' } },
      schema: {
        body: { sessionId: { type: 'string' } },
        response: { 200: { $ref: 'AiInsightResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { sessionId } = insightsBodySchema.parse(request.body);

      const session = await fastify.prisma.anamnesisSession.findFirst({
        where: { id: sessionId, tenantId },
        include: { template: true },
      });
      if (!session) throw new NotFoundError('Session not found');

      const existing = await fastify.prisma.aiInsight.findUnique({
        where: { sessionId },
      });
      if (existing) {
        return reply.status(200).send(toInsightResponse(existing));
      }

      const answersList = await fastify.prisma.anamnesisAnswer.findMany({
        where: { sessionId, tenantId },
        orderBy: { createdAt: 'desc' },
      });
      const mergedAnswers: Record<string, unknown> = {};
      for (const a of answersList) {
        Object.assign(mergedAnswers, a.answersJson as Record<string, unknown>);
      }

      const template = session.template.schemaJson as unknown as TemplateSchemaJson;
      const payload = await generateInsights(env.AI_MODE, template, mergedAnswers, {
        provider: env.AI_PROVIDER,
        apiKey: env.AI_API_KEY,
        model: env.AI_MODEL,
      });

      const insightData = {
        tenantId,
        sessionId,
        summary: payload.summary,
        risksJson: payload.risks as object,
        recommendationsJson: payload.recommendations as unknown as object,
      };

      const idempotencyKey = getIdempotencyKey(request);
      const requestHash = getRequestHash(request);

      if (idempotencyKey) {
        const handler = async () => {
          const insight = await createInsightSafe(fastify.prisma, insightData);
          return { response: insight, statusCode: 200 };
        };
        const result = await withIdempotency(
          fastify.prisma,
          tenantId,
          idempotencyKey,
          requestHash,
          handler
        );
        return reply.status(result.statusCode).send(toInsightResponse(result.response));
      }

      const insight = await createInsightSafe(fastify.prisma, insightData);
      return reply.status(200).send(toInsightResponse(insight));
    }
  );

  fastify.get(
    '/v1/ai/insights/:sessionId',
    {
      config: { rateLimit: { max: env.RATE_LIMIT_AI, timeWindow: '1 minute' } },
      schema: {
        params: { sessionId: { type: 'string' } },
        response: { 200: { $ref: 'AiInsightResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);

      const { sessionId } = request.params as { sessionId: string };
      const insight = await fastify.prisma.aiInsight.findFirst({
        where: { sessionId, tenantId },
      });
      if (!insight) throw new NotFoundError('Insights not found for this session');
      return reply.status(200).send(toInsightResponse(insight));
    }
  );
}
