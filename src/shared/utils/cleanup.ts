import type { PrismaClient } from '@prisma/client';

export async function cleanupExpiredTokens(prisma: PrismaClient): Promise<number> {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const result = await prisma.refreshToken.deleteMany({
    where: {
      OR: [{ expiresAt: { lt: new Date() } }, { revokedAt: { not: null, lt: sevenDaysAgo } }],
    },
  });

  return result.count;
}

export async function cleanupExpiredIdempotencyKeys(prisma: PrismaClient): Promise<number> {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const result = await prisma.idempotencyKey.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return result.count;
}
