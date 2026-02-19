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
import { generateAnswersHash } from './cache.js';
import { calculateCost } from './cost-calculator.js';
import { checkAndSendCostAlert, getCostAlertStatus } from './cost-alerts.js';
import { getCachedInsight, cacheInsight } from './redis-cache.js';

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
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
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

      // Check for existing insight for this session
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
      const answersHash = generateAnswersHash(template, mergedAnswers);

      // Check for similar insights (cache) - only if LLM mode
      if (env.AI_MODE === 'llm') {
        // Try Redis cache first, then database
        const cachedInsightData = await getCachedInsight(fastify.prisma, tenantId, answersHash);

        if (cachedInsightData && cachedInsightData.sessionId !== sessionId) {
          // Reuse cached insight but create new record for this session
          const cachedInsight = await fastify.prisma.aiInsight.create({
            data: {
              tenantId,
              sessionId,
              summary: cachedInsightData.summary,
              risksJson: cachedInsightData.risksJson as object,
              recommendationsJson: cachedInsightData.recommendationsJson as unknown as object,
              answersHash,
            },
          });
          return reply.status(200).send(toInsightResponse(cachedInsight));
        }

        // Also check database for similar insights
        const similarInsight = await fastify.prisma.aiInsight.findFirst({
          where: {
            tenantId,
            answersHash,
            sessionId: { not: sessionId }, // Different session
          },
          orderBy: { createdAt: 'desc' },
        });

        if (similarInsight) {
          // Reuse similar insight but create new record for this session
          const cachedInsight = await fastify.prisma.aiInsight.create({
            data: {
              tenantId,
              sessionId,
              summary: similarInsight.summary,
              risksJson: similarInsight.risksJson as object,
              recommendationsJson: similarInsight.recommendationsJson as unknown as object,
              answersHash,
            },
          });
          // Cache in Redis for future lookups
          await cacheInsight(tenantId, answersHash, {
            sessionId: cachedInsight.sessionId,
            summary: cachedInsight.summary,
            risksJson: cachedInsight.risksJson,
            recommendationsJson: cachedInsight.recommendationsJson,
          }).catch((err) => {
            request.log.warn({ err }, 'Failed to cache insight in Redis');
          });
          return reply.status(200).send(toInsightResponse(cachedInsight));
        }
      }

      // Use fine-tuned model if configured for this template, otherwise use default
      const modelToUse = session.template.llmFinetunedModel || env.AI_MODEL;
      const finalModel =
        modelToUse || (env.AI_PROVIDER === 'openai' ? 'gpt-4o' : 'claude-sonnet-4-5');

      const payload = await generateInsights(env.AI_MODE, template, mergedAnswers, {
        provider: env.AI_PROVIDER,
        apiKey: env.AI_API_KEY,
        model: modelToUse,
        fallbackProvider: env.AI_FALLBACK_PROVIDER,
        fallbackApiKey: env.AI_FALLBACK_API_KEY,
        fallbackModel: env.AI_FALLBACK_MODEL,
        customPrompt: session.template.llmPrompt,
      });

      const insightData = {
        tenantId,
        sessionId,
        summary: payload.summary,
        risksJson: payload.risks as object,
        recommendationsJson: payload.recommendations as unknown as object,
        answersHash: env.AI_MODE === 'llm' ? answersHash : null,
      };

      // Record usage metrics if LLM was used
      if (env.AI_MODE === 'llm' && payload.usage && env.AI_PROVIDER) {
        const cost = calculateCost(
          env.AI_PROVIDER as 'openai' | 'anthropic',
          finalModel,
          {
            inputTokens: payload.usage.inputTokens,
            outputTokens: payload.usage.outputTokens,
          }
        );

        await fastify.prisma.aiUsageMetric.create({
          data: {
            tenantId,
            sessionId,
            provider: env.AI_PROVIDER,
            model: finalModel,
            inputTokens: payload.usage.inputTokens,
            outputTokens: payload.usage.outputTokens,
            estimatedCostUsd: cost.estimatedCostUsd,
          },
        });

        // Check and send cost alert if needed (async, don't wait)
        void checkAndSendCostAlert(fastify.prisma, tenantId).catch((err) => {
          request.log.error({ err, tenantId }, 'Failed to check cost alert');
        });
      }

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

      // Cache in Redis if LLM mode
      if (env.AI_MODE === 'llm') {
        await cacheInsight(tenantId, answersHash, {
          sessionId: insight.sessionId,
          summary: insight.summary,
          risksJson: insight.risksJson,
          recommendationsJson: insight.recommendationsJson,
        }).catch((err) => {
          request.log.warn({ err }, 'Failed to cache insight in Redis');
        });
      }

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

  // GET /v1/ai/usage — get AI usage metrics for tenant
  fastify.get(
    '/v1/ai/usage',
    {
      config: { rateLimit: { max: env.RATE_LIMIT_AI, timeWindow: '1 minute' } },
      schema: {
        querystring: {
          from: { type: 'string' },
          to: { type: 'string' },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);

      const query = request.query as { from?: string; to?: string };
      const where: { tenantId: string; createdAt?: { gte?: Date; lte?: Date } } = { tenantId };

      if (query.from || query.to) {
        where.createdAt = {};
        if (query.from) where.createdAt.gte = new Date(query.from);
        if (query.to) where.createdAt.lte = new Date(query.to);
      }

      const metrics = await fastify.prisma.aiUsageMetric.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 1000, // Limit to recent 1000 records
      });

      const totals = metrics.reduce(
        (acc, m) => ({
          totalInputTokens: acc.totalInputTokens + m.inputTokens,
          totalOutputTokens: acc.totalOutputTokens + m.outputTokens,
          totalCostUsd: acc.totalCostUsd + m.estimatedCostUsd,
        }),
        { totalInputTokens: 0, totalOutputTokens: 0, totalCostUsd: 0 }
      );

      return reply.status(200).send({
        period: {
          from: query.from || null,
          to: query.to || null,
        },
        totals,
        records: metrics.map((m) => ({
          id: m.id,
          sessionId: m.sessionId,
          provider: m.provider,
          model: m.model,
          inputTokens: m.inputTokens,
          outputTokens: m.outputTokens,
          estimatedCostUsd: m.estimatedCostUsd,
          createdAt: m.createdAt,
        })),
      });
    }
  );

  // GET /v1/ai/cost-alert-status — get cost alert status for tenant
  fastify.get('/v1/ai/cost-alert-status', async (request, reply) => {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);

    const status = await getCostAlertStatus(fastify.prisma, tenantId);
    return reply.status(200).send(status);
  });

  // PATCH /v1/ai/cost-alert-config — update cost alert configuration (admin/owner only)
  fastify.patch(
    '/v1/ai/cost-alert-config',
    {
      schema: {
        body: {
          limitUsd: { type: 'number' },
          thresholdPercent: { type: 'number' },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.tenants(user.role); // Only admin/owner can configure

      const body = request.body as { limitUsd?: number; thresholdPercent?: number };

      const updateData: {
        aiCostLimitUsd?: number | null;
        aiCostAlertThreshold?: number | null;
      } = {};

      if (body.limitUsd !== undefined) {
        updateData.aiCostLimitUsd = body.limitUsd > 0 ? body.limitUsd : null;
      }
      if (body.thresholdPercent !== undefined) {
        updateData.aiCostAlertThreshold =
          body.thresholdPercent >= 0 && body.thresholdPercent <= 100
            ? body.thresholdPercent
            : null;
      }

      const tenant = await fastify.prisma.tenant.update({
        where: { id: tenantId },
        data: updateData,
        select: {
          aiCostLimitUsd: true,
          aiCostAlertThreshold: true,
        },
      });

      return reply.status(200).send(tenant);
    }
  );
}
