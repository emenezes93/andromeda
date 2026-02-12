import fp from 'fastify-plugin';
import { UnauthorizedError } from '../shared/errors.js';
const HEADER_TENANT = 'x-tenant-id';
async function tenantPlugin(fastify) {
    fastify.decorateRequest('tenantId', null);
    fastify.addHook('preHandler', async (request, reply) => {
        const tenantId = request.headers[HEADER_TENANT];
        if (tenantId) {
            request.tenantId = tenantId.trim();
            if (request.tenantId && fastify.setTenantId) {
                await fastify.setTenantId(request.tenantId);
            }
        }
    });
}
export function requireTenant(request) {
    const id = request.tenantId;
    if (!id)
        throw new UnauthorizedError('Missing x-tenant-id header');
    return id;
}
export default fp(tenantPlugin, { name: 'tenant' });
//# sourceMappingURL=tenant.js.map