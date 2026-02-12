import type { PrismaClient } from '@prisma/client';
import { Membership } from '../../domain/entities/Membership.js';
import type { IMembershipRepository } from '../../ports/repositories/IMembershipRepository.js';
/**
 * Adapter: Prisma Membership Repository Implementation
 */
export declare class PrismaMembershipRepository implements IMembershipRepository {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    findByUserId(userId: string): Promise<Membership | null>;
    findByUserIdAndTenantId(userId: string, tenantId: string): Promise<Membership | null>;
    create(membership: Membership): Promise<Membership>;
    private toDomain;
}
//# sourceMappingURL=PrismaMembershipRepository.d.ts.map