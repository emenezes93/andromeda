import { z } from 'zod';
import { requireTenant } from '../../http/middleware/tenant.js';
import { requireAuth } from '../../http/middleware/auth.js';
import { Guards } from '../../shared/utils/rbac.js';
import { paginationQuerySchema, skipFor } from '../../shared/utils/pagination.js';
const auditQuerySchema = paginationQuerySchema.extend({
    action: z.string().optional(),
    entity: z.string().optional(),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
});
export async function auditRoutes(fastify) {
    fastify.get('/v1/audit', {
        schema: {
            querystring: {
                page: { type: 'number' },
                limit: { type: 'number' },
                action: { type: 'string' },
                entity: { type: 'string' },
                from: { type: 'string' },
                to: { type: 'string' },
            },
            response: { 200: { $ref: 'AuditListResponse#' } },
        },
    }, async (request, reply) => {
        const tenantId = requireTenant(request);
        requireAuth(request);
        Guards.audit(request.user.role);
        const q = auditQuerySchema.parse(request.query);
        const skip = skipFor(q.page, q.limit);
        const where = { tenantId };
        if (q.action)
            where.action = q.action;
        if (q.entity)
            where.entity = q.entity;
        if (q.from || q.to) {
            where.createdAt = {};
            if (q.from)
                where.createdAt.gte = new Date(q.from);
            if (q.to)
                where.createdAt.lte = new Date(q.to);
        }
        const [items, total] = await Promise.all([
            fastify.prisma.auditLog.findMany({
                where,
                skip,
                take: q.limit,
                orderBy: { createdAt: 'desc' },
            }),
            fastify.prisma.auditLog.count({ where }),
        ]);
        return reply.status(200).send({
            data: items,
            meta: {
                page: q.page,
                limit: q.limit,
                total,
                totalPages: Math.ceil(total / q.limit) || 1,
                hasMore: q.page * q.limit < total,
            },
        });
    });
}
//# sourceMappingURL=routes.js.map