import { createTemplateSchema, paginationQuerySchema } from './schemas.js';
import { requireTenant } from '../../../plugins/tenant.js';
import { requireAuth } from '../../../plugins/auth.js';
import { Guards } from '../../../shared/rbac.js';
import { NotFoundError } from '../../../shared/errors.js';
import { skipFor } from '../../../shared/pagination.js';
import { getIdempotencyKey, getRequestHash, withIdempotency } from '../../../shared/idempotency.js';
import { env } from '../../../plugins/env.js';
export async function templatesRoutes(fastify) {
    fastify.post('/v1/anamnesis/templates', {
        config: { rateLimit: { max: env.RATE_LIMIT_TEMPLATES, timeWindow: '1 minute' } },
        schema: {
            body: { $ref: 'CreateTemplateBody#' },
            response: { 201: { $ref: 'TemplateResponse#' } },
        },
    }, async (request, reply) => {
        const tenantId = requireTenant(request);
        const user = requireAuth(request);
        Guards.templates(user.role);
        const body = createTemplateSchema.parse(request.body);
        const idempotencyKey = getIdempotencyKey(request);
        const requestHash = getRequestHash(request);
        const handler = async () => {
            const template = await fastify.prisma.anamnesisTemplate.create({
                data: {
                    tenantId,
                    name: body.name,
                    schemaJson: body.schemaJson,
                },
            });
            return { response: template, statusCode: 201 };
        };
        if (idempotencyKey) {
            const result = await withIdempotency(fastify.prisma, tenantId, idempotencyKey, requestHash, handler);
            return reply.status(result.statusCode).send(result.response);
        }
        const { response, statusCode } = await handler();
        return reply.status(statusCode).send(response);
    });
    fastify.get('/v1/anamnesis/templates/:id', {
        config: { rateLimit: { max: env.RATE_LIMIT_TEMPLATES, timeWindow: '1 minute' } },
        schema: {
            params: { id: { type: 'string' } },
            response: { 200: { $ref: 'TemplateResponse#' } },
        },
    }, async (request, reply) => {
        const tenantId = requireTenant(request);
        requireAuth(request);
        Guards.readOnly(request.user.role);
        const { id } = request.params;
        const template = await fastify.prisma.anamnesisTemplate.findFirst({
            where: { id, tenantId },
        });
        if (!template)
            throw new NotFoundError('Template not found');
        return reply.status(200).send(template);
    });
    fastify.get('/v1/anamnesis/templates', {
        config: { rateLimit: { max: env.RATE_LIMIT_TEMPLATES, timeWindow: '1 minute' } },
        schema: {
            querystring: { page: { type: 'number' }, limit: { type: 'number' } },
            response: { 200: { $ref: 'TemplateListResponse#' } },
        },
    }, async (request, reply) => {
        const tenantId = requireTenant(request);
        requireAuth(request);
        Guards.readOnly(request.user.role);
        const { page, limit } = paginationQuerySchema.parse(request.query);
        const skip = skipFor(page, limit);
        const [items, total] = await Promise.all([
            fastify.prisma.anamnesisTemplate.findMany({
                where: { tenantId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            fastify.prisma.anamnesisTemplate.count({ where: { tenantId } }),
        ]);
        return reply.status(200).send({
            data: items,
            meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1, hasMore: page * limit < total },
        });
    });
}
//# sourceMappingURL=routes.js.map