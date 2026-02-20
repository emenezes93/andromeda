import type { PrismaClient } from '@prisma/client';
import { RefreshToken } from '@domain/entities/RefreshToken.js';
import type { IRefreshTokenRepository } from '@ports/repositories/IRefreshTokenRepository.js';

/**
 * Adapter: Prisma RefreshToken Repository Implementation
 */
export class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByToken(token: string): Promise<RefreshToken | null> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { token },
    });
    if (!stored) return null;
    return this.toDomain(stored);
  }

  async create(refreshToken: RefreshToken): Promise<RefreshToken> {
    const created = await this.prisma.refreshToken.create({
      data: {
        userId: refreshToken.userId,
        tenantId: refreshToken.tenantId,
        token: refreshToken.token,
        expiresAt: refreshToken.expiresAt,
      },
    });
    return this.toDomain(created);
  }

  async revoke(refreshToken: RefreshToken): Promise<void> {
    await this.prisma.refreshToken.update({
      where: { id: refreshToken.id },
      data: { revokedAt: refreshToken.revokedAt ?? new Date() },
    });
  }

  async revokeByToken(token: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUserInTenant(userId: string, tenantId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, tenantId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });
    return result.count;
  }

  private toDomain(prismaToken: {
    id: string;
    userId: string;
    tenantId: string;
    token: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
  }): RefreshToken {
    return new RefreshToken(
      prismaToken.id,
      prismaToken.userId,
      prismaToken.tenantId,
      prismaToken.token,
      prismaToken.expiresAt,
      prismaToken.revokedAt,
      prismaToken.createdAt
    );
  }
}
