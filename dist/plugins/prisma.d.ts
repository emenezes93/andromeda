import { PrismaClient } from '@prisma/client';
declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
        setTenantId: (tenantId: string) => Promise<void>;
        clearTenantId: () => Promise<void>;
    }
}
declare const _default: any;
export default _default;
//# sourceMappingURL=prisma.d.ts.map