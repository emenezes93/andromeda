import { createTenantSchema } from './schemas.js';
import { requireTenant } from '../../http/middleware/tenant.js';
import { requireAuth } from '../../http/middleware/auth.js';
import { Guards } from '../../shared/utils/rbac.js';
import { NotFoundError } from '../../shared/errors/index.js';
import { auditLog } from '../../shared/utils/audit.js';
export async function tenantsRoutes(fastify) {
    fastify.post('/v1/tenants', {
        schema: {
            body: { $ref: 'CreateTenantBody#' },
            response: { 201: { $ref: 'TenantResponse#' } },
        },
    }, async (request, reply) => {
        requireTenant(request);
        const user = requireAuth(request);
        Guards.tenants(user.role);
        const body = createTenantSchema.parse(request.body);
        const tenant = await fastify.prisma.tenant.create({
            data: { name: body.name, status: body.status },
        });
        await auditLog(fastify.prisma, user.tenantId, 'create', 'tenant', tenant.id, user.userId, { name: tenant.name });
        return reply.status(201).send(tenant);
    });
    fastify.get('/v1/tenants/:id', {
        schema: {
            params: { id: { type: 'string' } },
            response: { 200: { $ref: 'TenantResponse#' } },
        },
    }, async (request, reply) => {
        const tenantId = requireTenant(request);
        const user = requireAuth(request);
        Guards.tenants(user.role);
        const { id } = request.params;
        if (id !== tenantId)
            throw new NotFoundError('Tenant not found');
        const tenant = await fastify.prisma.tenant.findUnique({ where: { id } });
        if (!tenant)
            throw new NotFoundError('Tenant not found');
        return reply.status(200).send(tenant);
    });
}
//# sourceMappingURL=routes.js.map