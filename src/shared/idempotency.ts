import type { FastifyRequest } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
import { ConflictError } from './errors.js';

const HEADER_KEY = 'idempotency-key';
const IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export function getRequestHash(req: FastifyRequest): string {
  const body = req.body ?? {};
  const sorted = JSON.stringify(body, Object.keys(body).sort());
  return createHash('sha256')
    .update(req.method + req.url + sorted)
    .digest('hex');
}

export function getIdempotencyKey(req: FastifyRequest): string | undefined {
  return req.headers[HEADER_KEY] as string | undefined;
}

export async function withIdempotency<T>(
  prisma: PrismaClient,
  tenantId: string,
  key: string,
  requestHash: string,
  handler: () => Promise<{ response: T; statusCode: number }>
): Promise<{ response: T; statusCode: number; fromCache: boolean }> {
  const existing = await prisma.idempotencyKey.findUnique({
    where: { tenantId_key: { tenantId, key } },
  });

  if (existing) {
    const age = Date.now() - existing.createdAt.getTime();
    if (age > IDEMPOTENCY_TTL_MS) {
      // Key expired — delete and reprocess
      await prisma.idempotencyKey.delete({
        where: { tenantId_key: { tenantId, key } },
      });
    } else {
      if (existing.requestHash !== requestHash) {
        throw new ConflictError('Idempotency key reused with different request body');
      }
      return {
        response: existing.responseJson as T,
        statusCode: existing.statusCode,
        fromCache: true,
      };
    }
  }

  const { response, statusCode } = await handler();

  await prisma.idempotencyKey.create({
    data: {
      tenantId,
      key,
      requestHash,
      responseJson: response as object,
      statusCode,
    },
  });

  return { response, statusCode, fromCache: false };
}

export function idempotencyKeyOptionalSchema() {
  return {
    [HEADER_KEY]: { type: 'string', description: 'Optional idempotency key for safe retries' },
  };
}
