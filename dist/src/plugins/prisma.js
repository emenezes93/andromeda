import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
const SOFT_DELETE_MODELS = ['Tenant', 'User', 'AnamnesisTemplate', 'AnamnesisSession'];
async function prismaPlugin(fastify) {
    const prisma = new PrismaClient({
        log: fastify.log.level === 'trace' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });
    const softDeleteMiddleware = async (params, next) => {
        if ((params.action === 'findMany' || params.action === 'findFirst' || params.action === 'findUnique') &&
            params.model &&
            SOFT_DELETE_MODELS.includes(params.model)) {
            params.args = params.args ?? {};
            params.args.where = { ...params.args.where, deletedAt: null };
        }
        return next(params);
    };
    prisma.$use(softDeleteMiddleware);
    fastify.decorate('prisma', prisma);
    fastify.decorate('setTenantId', async (tenantId) => {
        await prisma.$executeRaw `SELECT set_config('app.tenant_id', ${tenantId}, true)`;
    });
    fastify.decorate('clearTenantId', async () => {
        await prisma.$executeRaw `SELECT set_config('app.tenant_id', '', true)`;
    });
    fastify.addHook('onClose', async (instance) => {
        await instance.prisma.$disconnect();
    });
}
export default fp(prismaPlugin, { name: 'prisma' });
//# sourceMappingURL=prisma.js.map