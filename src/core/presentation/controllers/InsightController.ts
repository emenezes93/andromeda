import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { getIdempotencyKey, getRequestHash, withIdempotency } from '@shared/utils/idempotency.js';
import { env } from '@config/env.js';
import type { GenerateInsightsUseCase } from '@application/use-cases/insights/GenerateInsightsUseCase.js';
import type { GetInsightBySessionUseCase } from '@application/use-cases/insights/GetInsightBySessionUseCase.js';
import type { Insight } from '@domain/entities/Insight.js';
import type { PrismaClient } from '@prisma/client';

const DEFAULT_RISKS = { readiness: 50, dropoutRisk: 30, stress: 50, sleepQuality: 50 };

function toNum(value: unknown): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : 50;
}

function normalizeRisksJson(raw: unknown): Record<string, number> {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    readiness: toNum(o.readiness ?? DEFAULT_RISKS.readiness),
    dropoutRisk: toNum(o.dropoutRisk ?? o.dropout_risk ?? DEFAULT_RISKS.dropoutRisk),
    stress: toNum(o.stress ?? DEFAULT_RISKS.stress),
    sleepQuality: toNum(o.sleepQuality ?? o.sleep_quality ?? DEFAULT_RISKS.sleepQuality),
  };
}

function toInsightResponse(insight: Insight) {
  return {
    id: insight.id,
    sessionId: insight.sessionId,
    summary: insight.summary ?? '',
    risksJson: normalizeRisksJson(insight.risksJson),
    recommendationsJson: insight.recommendationsJson,
    createdAt: insight.createdAt,
  };
}

const insightsBodySchema = z.object({ sessionId: z.string() });
const RATE_LIMIT_AI = Number(env.RATE_LIMIT_AI) || 10;

export class InsightController {
  constructor(
    private readonly generateInsightsUseCase: GenerateInsightsUseCase,
    private readonly getInsightBySessionUseCase: GetInsightBySessionUseCase,
    private readonly prisma: PrismaClient
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.post(
      '/v1/anamnesis/insights',
      {
        config: { rateLimit: { max: RATE_LIMIT_AI, timeWindow: '1 minute' } },
        schema: {
          body: { type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] },
          response: { 200: { $ref: 'AiInsightResponse#' } },
        },
      },
      this.generate.bind(this)
    );

    app.get(
      '/v1/anamnesis/sessions/:sessionId/insights',
      {
        config: { rateLimit: { max: RATE_LIMIT_AI, timeWindow: '1 minute' } },
        schema: {
          params: { type: 'object', required: ['sessionId'], properties: { sessionId: { type: 'string' } } },
          response: { 200: { $ref: 'AiInsightResponse#' } },
        },
      },
      this.getBySession.bind(this)
    );

    // Legacy AI paths (same handlers)
    app.post(
      '/v1/ai/insights',
      {
        config: { rateLimit: { max: RATE_LIMIT_AI, timeWindow: '1 minute' } },
        schema: {
          body: { type: 'object', properties: { sessionId: { type: 'string' } }, required: ['sessionId'] },
          response: { 200: { $ref: 'AiInsightResponse#' } },
        },
      },
      this.generate.bind(this)
    );
    app.get(
      '/v1/ai/insights/:sessionId',
      {
        config: { rateLimit: { max: RATE_LIMIT_AI, timeWindow: '1 minute' } },
        schema: {
          params: { type: 'object', required: ['sessionId'], properties: { sessionId: { type: 'string' } } },
          response: { 200: { $ref: 'AiInsightResponse#' } },
        },
      },
      this.getBySession.bind(this)
    );
  }

  private async generate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.sessions(user.role);

    const body = insightsBodySchema.parse(request.body);
    const idempotencyKey = getIdempotencyKey(request);
    const requestHash = getRequestHash(request);
    const useCache = env.AI_MODE === 'llm';

    const handler = async () => {
      const insight = await this.generateInsightsUseCase.execute({
        sessionId: body.sessionId,
        tenantId,
        actorUserId: user.userId,
        useCache,
      });
      return { response: toInsightResponse(insight), statusCode: 200 as const };
    };

    if (idempotencyKey) {
      const result = await withIdempotency(
        this.prisma,
        tenantId,
        idempotencyKey,
        requestHash,
        handler
      );
      await reply.status(result.statusCode).send(result.response);
      return;
    }
    const { response, statusCode } = await handler();
    await reply.status(statusCode).send(response);
  }

  private async getBySession(
    request: FastifyRequest<{ Params: { sessionId: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);

    const { sessionId } = request.params;
    const insight = await this.getInsightBySessionUseCase.execute({ sessionId, tenantId });
    await reply.status(200).send(toInsightResponse(insight));
  }
}
