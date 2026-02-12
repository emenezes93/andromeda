import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import type { AuthUser } from '@shared/types/index.js';
import { UnauthorizedError } from '@shared/errors/index.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export interface AuthPluginOptions {
  secret: string;
  skipPaths?: string[];
}

async function authPlugin(
  fastify: FastifyInstance,
  opts: AuthPluginOptions
): Promise<void> {
  const { secret, skipPaths = ['/health', '/ready', '/v1/auth/login', '/documentation', '/documentation/json'] } = opts;

  fastify.decorateRequest('user', undefined);

  fastify.addHook('preHandler', async (request: FastifyRequest, _reply: FastifyReply) => {
    const path = request.routerPath ?? request.url.split('?')[0];
    if (skipPaths.some((p) => path === p || path.startsWith(p + '/'))) {
      return;
    }

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid Authorization header');
    }

    const token = authHeader.slice(7);
    try {
      const payload = jwt.verify(token, secret) as { userId: string; email: string; role: string; tenantId: string };
      request.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role as AuthUser['role'],
        tenantId: payload.tenantId,
      };
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }
  });
}

export function requireAuth(request: FastifyRequest): AuthUser {
  if (!request.user) throw new UnauthorizedError('Authentication required');
  return request.user;
}

export default fp(authPlugin, { name: 'auth' });
