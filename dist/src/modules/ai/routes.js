import { z } from 'zod';
import { requireTenant } from '../../http/middleware/tenant.js';
import { requireAuth } from '../../http/middleware/auth.js';
import { Guards } from '../../shared/utils/rbac.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { env } from '../../config/env.js';
import { generateInsights } from './service.js';
import { getIdempotencyKey, getRequestHash, withIdempotency } from '../../shared/utils/idempotency.js';
const insightsBodySchema = z.object({ sessionId: z.string() });
export async function aiRoutes(fastify) {
    fastify.post('/v1/ai/insights', {
        config: { rateLimit: { max: env.RATE_LIMIT_AI, timeWindow: '1 minute' } },
        schema: {
            body: { sessionId: { type: 'string' } },
            response: { 200: { $ref: 'AiInsightResponse#' } },
        },
    }, async (request, reply) => {
        const tenantId = requireTenant(request);
        const user = requireAuth(request);
        Guards.sessions(user.role);
        const { sessionId } = insightsBodySchema.parse(request.body);
        const session = await fastify.prisma.anamnesisSession.findFirst({
            where: { id: sessionId, tenantId },
            include: { template: true },
        });
        if (!session)
            throw new NotFoundError('Session not found');
        const existing = await fastify.prisma.aiInsight.findUnique({
            where: { sessionId },
        });
        if (existing) {
            return reply.status(200).send(existing);
        }
        const answersList = await fastify.prisma.anamnesisAnswer.findMany({
            where: { sessionId, tenantId },
            orderBy: { createdAt: 'desc' },
        });
        const mergedAnswers = {};
        for (const a of answersList) {
            Object.assign(mergedAnswers, a.answersJson);
        }
        const template = session.template.schemaJson;
        const payload = generateInsights(env.AI_MODE, template, mergedAnswers);
        const idempotencyKey = getIdempotencyKey(request);
        const requestHash = getRequestHash(request);
        const handler = async () => {
            const insight = await fastify.prisma.aiInsight.create({
                data: {
                    tenantId,
                    sessionId,
                    summary: payload.summary,
                    risksJson: payload.risks,
                    recommendationsJson: payload.recommendations,
                },
            });
            return { response: insight, statusCode: 200 };
        };
        if (idempotencyKey) {
            const result = await withIdempotency(fastify.prisma, tenantId, idempotencyKey, requestHash, handler);
            return reply.status(result.statusCode).send(result.response);
        }
        const insight = await fastify.prisma.aiInsight.create({
            data: {
                tenantId,
                sessionId,
                summary: payload.summary,
                risksJson: payload.risks,
                recommendationsJson: payload.recommendations,
            },
        });
        return reply.status(200).send(insight);
    });
    fastify.get('/v1/ai/insights/:sessionId', {
        config: { rateLimit: { max: env.RATE_LIMIT_AI, timeWindow: '1 minute' } },
        schema: {
            params: { sessionId: { type: 'string' } },
            response: { 200: { $ref: 'AiInsightResponse#' } },
        },
    }, async (request, reply) => {
        const tenantId = requireTenant(request);
        requireAuth(request);
        Guards.readOnly(request.user.role);
        const { sessionId } = request.params;
        const insight = await fastify.prisma.aiInsight.findFirst({
            where: { sessionId, tenantId },
        });
        if (!insight)
            throw new NotFoundError('Insights not found for this session');
        return reply.status(200).send(insight);
    });
}
//# sourceMappingURL=routes.js.map