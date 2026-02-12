import { RefreshToken } from '../../domain/entities/RefreshToken.js';
/**
 * Adapter: Prisma RefreshToken Repository Implementation
 */
export class PrismaRefreshTokenRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByToken(token) {
        const stored = await this.prisma.refreshToken.findUnique({
            where: { token },
        });
        if (!stored)
            return null;
        return this.toDomain(stored);
    }
    async create(refreshToken) {
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
    async revoke(refreshToken) {
        await this.prisma.refreshToken.update({
            where: { id: refreshToken.id },
            data: { revokedAt: refreshToken.revokedAt ?? new Date() },
        });
    }
    async revokeByToken(token) {
        await this.prisma.refreshToken.updateMany({
            where: { token, revokedAt: null },
            data: { revokedAt: new Date() },
        });
    }
    async deleteExpired() {
        const result = await this.prisma.refreshToken.deleteMany({
            where: {
                expiresAt: { lt: new Date() },
            },
        });
        return result.count;
    }
    toDomain(prismaToken) {
        return new RefreshToken(prismaToken.id, prismaToken.userId, prismaToken.tenantId, prismaToken.token, prismaToken.expiresAt, prismaToken.revokedAt, prismaToken.createdAt);
    }
}
//# sourceMappingURL=PrismaRefreshTokenRepository.js.map