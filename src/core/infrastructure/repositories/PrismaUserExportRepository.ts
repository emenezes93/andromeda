import type { PrismaClient } from '@prisma/client';
import type { UserExportDto } from '@ports/repositories/IUserExportRepository.js';
import type { IUserExportRepository } from '@ports/repositories/IUserExportRepository.js';

/**
 * Adapter: Prisma implementation of user data export for GDPR.
 */
export class PrismaUserExportRepository implements IUserExportRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getExportData(userId: string): Promise<UserExportDto | null> {
    const [user, memberships, auditLogs, refreshTokens] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
          twoFactorEnabled: true,
        },
      }),
      this.prisma.membership.findMany({
        where: { userId },
        select: {
          tenantId: true,
          role: true,
          active: true,
          createdAt: true,
        },
      }),
      this.prisma.auditLog.findMany({
        where: { actorUserId: userId },
        orderBy: { createdAt: 'desc' },
        select: {
          tenantId: true,
          action: true,
          entity: true,
          entityId: true,
          metadataJson: true,
          createdAt: true,
        },
      }),
      this.prisma.refreshToken.findMany({
        where: { userId },
        select: { expiresAt: true, revokedAt: true },
      }),
    ]);

    if (!user) return null;

    const now = new Date();
    const active = refreshTokens.filter((t) => !t.revokedAt && t.expiresAt > now).length;
    const revoked = refreshTokens.filter((t) => t.revokedAt !== null).length;

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
        twoFactorEnabled: user.twoFactorEnabled,
      },
      memberships: memberships.map((m) => ({
        tenantId: m.tenantId,
        role: m.role,
        active: m.active,
        createdAt: m.createdAt.toISOString(),
      })),
      auditLogs: auditLogs.map((a) => ({
        tenantId: a.tenantId,
        action: a.action,
        entity: a.entity,
        entityId: a.entityId,
        metadataJson: a.metadataJson,
        createdAt: a.createdAt.toISOString(),
      })),
      refreshTokensSummary: {
        total: refreshTokens.length,
        active,
        revoked,
      },
    };
  }
}
