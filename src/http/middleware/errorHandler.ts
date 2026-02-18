import type { FastifyInstance, FastifyError } from 'fastify';
import fp from 'fastify-plugin';
import { isAppError, statusFromError, messageFromError } from '@shared/errors/index.js';
import { env } from '@config/env.js';
import { ZodError } from 'zod';

function isLikelySchemaError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('relation') ||
    lower.includes('column') ||
    lower.includes('does not exist') ||
    lower.includes('migration')
  );
}

async function errorHandlerPlugin(fastify: FastifyInstance): Promise<void> {
  fastify.setErrorHandler((err: FastifyError, request, reply) => {
    const requestId = request.id ?? 'unknown';

    if (isAppError(err)) {
      request.log.warn({ err, requestId }, err.message);
      return reply.status(err.statusCode).send({
        error: err.message,
        code: err.code,
        requestId,
      });
    }

    if (err.validation) {
      request.log.warn({ err: err.validation, requestId }, 'Validation error');
      return reply.status(400).send({
        error: 'Validation failed',
        details: err.validation,
        requestId,
      });
    }

    if (err instanceof ZodError) {
      request.log.warn({ err: err.flatten(), requestId }, 'Zod validation error');
      return reply.status(422).send({
        error: 'Validation failed',
        details: err.flatten().fieldErrors,
        requestId,
      });
    }

    request.log.error({ err, requestId }, 'Unhandled error');
    const status = statusFromError(err);
    const rawMessage = messageFromError(err);
    const isDev = env.NODE_ENV !== 'production';
    const message = status >= 500 ? (isDev ? rawMessage : 'Internal server error') : rawMessage;

    const payload: { error: string; requestId: string; details?: string } = {
      error: message,
      requestId,
    };
    if (status >= 500 && isDev && isLikelySchemaError(rawMessage)) {
      payload.details = 'Run: npx prisma migrate deploy && npm run prisma:seed';
    }

    return reply.status(status).send(payload);
  });
}

export default fp(errorHandlerPlugin, { name: 'error-handler' });
