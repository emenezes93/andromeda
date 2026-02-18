import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
    setTenantId: (tenantId: string) => Promise<void>;
    clearTenantId: () => Promise<void>;
  }
}

/** Minimal type for Prisma $use middleware (avoids depending on generated client exports in Docker). */
interface PrismaUseParams {
  action: string;
  model?: string;
  args?: { where?: Record<string, unknown> };
}

const SOFT_DELETE_MODELS = ['Tenant', 'User', 'AnamnesisTemplate', 'AnamnesisSession'];

async function prismaPlugin(fastify: FastifyInstance): Promise<void> {
  const prisma = new PrismaClient({
    log: fastify.log.level === 'trace' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  });

  const softDeleteMiddleware = async (
    params: PrismaUseParams,
    next: (params: PrismaUseParams) => Promise<unknown>
  ): Promise<unknown> => {
    if (
      (params.action === 'findMany' ||
        params.action === 'findFirst' ||
        params.action === 'findUnique') &&
      params.model &&
      SOFT_DELETE_MODELS.includes(params.model)
    ) {
      params.args = params.args ?? {};
      params.args.where = { ...params.args.where, deletedAt: null };
    }
    return next(params);
  };
  prisma.$use(softDeleteMiddleware as never);

  fastify.decorate('prisma', prisma);

  fastify.decorate('setTenantId', async (tenantId: string) => {
    await prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
  });

  fastify.decorate('clearTenantId', async () => {
    await prisma.$executeRaw`SELECT set_config('app.tenant_id', '', true)`;
  });

  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
}

export default fp(prismaPlugin, { name: 'prisma' });
