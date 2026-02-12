import type { PrismaClient } from '@prisma/client';
import type { User } from '../../domain/entities/User.js';
import type { IUserRepository } from '../../ports/repositories/IUserRepository.js';
/**
 * Adapter: Prisma User Repository Implementation
 */
export declare class PrismaUserRepository implements IUserRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    create(user: User): Promise<User>;
    exists(email: string): Promise<boolean>;
    private toDomain;
}
//# sourceMappingURL=PrismaUserRepository.d.ts.map