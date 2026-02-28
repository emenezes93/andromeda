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
  fastify.decorateRequest('tenantId', undefined);

  fastify.addHook('preHandler', async (request: FastifyRequest, _reply: FastifyReply) => {
    const raw = request.headers[HEADER_TENANT] as string | undefined;
    if (raw) {
      const trimmed = raw.trim();
      if (trimmed.length > 0) {
        request.tenantId = trimmed;
        if (fastify.setTenantId) {
          await fastify.setTenantId(trimmed);
        }
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
