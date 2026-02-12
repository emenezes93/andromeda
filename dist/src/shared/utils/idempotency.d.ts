import type { FastifyRequest } from 'fastify';
import type { PrismaClient } from '@prisma/client';
export declare function getRequestHash(req: FastifyRequest): string;
export declare function getIdempotencyKey(req: FastifyRequest): string | undefined;
export declare function withIdempotency<T>(prisma: PrismaClient, tenantId: string, key: string, requestHash: string, handler: () => Promise<{
    response: T;
    statusCode: number;
}>): Promise<{
    response: T;
    statusCode: number;
    fromCache: boolean;
}>;
export declare function idempotencyKeyOptionalSchema(): {
    "idempotency-key": {
        type: string;
        description: string;
    };
};
//# sourceMappingURL=idempotency.d.ts.map