import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
declare module 'fastify' {
    interface FastifyInstance {
        prisma: PrismaClient;
        setTenantId: (tenantId: string) => Promise<void>;
        clearTenantId: () => Promise<void>;
    }
}
declare function prismaPlugin(fastify: FastifyInstance): Promise<void>;
declare const _default: typeof prismaPlugin;
export default _default;
//# sourceMappingURL=prisma.d.ts.map