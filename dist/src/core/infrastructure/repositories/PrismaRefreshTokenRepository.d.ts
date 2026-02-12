import type { PrismaClient } from '@prisma/client';
import { RefreshToken } from '../../domain/entities/RefreshToken.js';
import type { IRefreshTokenRepository } from '../../ports/repositories/IRefreshTokenRepository.js';
/**
 * Adapter: Prisma RefreshToken Repository Implementation
 */
export declare class PrismaRefreshTokenRepository implements IRefreshTokenRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findByToken(token: string): Promise<RefreshToken | null>;
    create(refreshToken: RefreshToken): Promise<RefreshToken>;
    revoke(refreshToken: RefreshToken): Promise<void>;
    revokeByToken(token: string): Promise<void>;
    deleteExpired(): Promise<number>;
    private toDomain;
}
//# sourceMappingURL=PrismaRefreshTokenRepository.d.ts.map