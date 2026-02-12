import { PrismaClient as PrismaClientConstructor } from '@prisma/client';
/**
 * Database Configuration
 * Centralizes Prisma client configuration and lifecycle
 */
export function createPrismaClient(logLevel = 'warn') {
    const prisma = new PrismaClientConstructor({
        log: logLevel === 'trace' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
    });
    // Soft delete middleware: auto-filter deleted records on reads
    const SOFT_DELETE_MODELS = ['Tenant', 'User', 'AnamnesisTemplate', 'AnamnesisSession'];
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
    return prisma;
}
export async function setupTenantContext(prisma, tenantId) {
    await prisma.$executeRaw `SELECT set_config('app.tenant_id', ${tenantId}, true)`;
}
export async function clearTenantContext(prisma) {
    await prisma.$executeRaw `SELECT set_config('app.tenant_id', '', true)`;
}
//# sourceMappingURL=database.js.map