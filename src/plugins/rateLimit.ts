import type { FastifyInstance, FastifyRequest } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import fp from 'fastify-plugin';

export interface RateLimitOptions {
  global: number;
  auth: number;
}

function keyGenerator(request: FastifyRequest): string {
  const user = (request as FastifyRequest & { user?: { userId: string } }).user;
  return user ? `user:${user.userId}` : `ip:${request.ip ?? 'unknown'}`;
}

async function rateLimitPlugin(fastify: FastifyInstance, opts: RateLimitOptions): Promise<void> {
  await fastify.register(rateLimit, {
    max: opts.global,
    timeWindow: '1 minute',
    keyGenerator,
  });
}

export default fp(rateLimitPlugin, { name: 'rate-limit' });
