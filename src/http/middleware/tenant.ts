import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { UnauthorizedError } from '@shared/errors/index.js';

const HEADER_TENANT = 'x-tenant-id';

declare module 'fastify' {
  interface FastifyRequest {
    tenantId?: string;
  }
}

async function tenantPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.decorateRequest('tenantId', null);

  fastify.addHook('preHandler', async (request: FastifyRequest, _reply: FastifyReply) => {
    const tenantId = request.headers[HEADER_TENANT] as string | undefined;
    if (tenantId) {
      request.tenantId = tenantId.trim();
      if (request.tenantId && fastify.setTenantId) {
        await fastify.setTenantId(request.tenantId);
      }
    }
  });
}

export function requireTenant(request: FastifyRequest): string {
  const id = request.tenantId;
  if (!id) throw new UnauthorizedError('Missing x-tenant-id header');
  return id;
}

export default fp(tenantPlugin, { name: 'tenant' });
