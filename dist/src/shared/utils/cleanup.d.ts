import type { PrismaClient } from '@prisma/client';
export declare function cleanupExpiredTokens(prisma: PrismaClient): Promise<number>;
export declare function cleanupExpiredIdempotencyKeys(prisma: PrismaClient): Promise<number>;
//# sourceMappingURL=cleanup.d.ts.map