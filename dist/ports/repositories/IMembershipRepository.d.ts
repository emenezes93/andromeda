import type { Membership } from '../../domain/entities/Membership.js';
/**
 * Port: Membership Repository Interface
 */
export interface IMembershipRepository {
    findByUserId(userId: string): Promise<Membership | null>;
    findByUserIdAndTenantId(userId: string, tenantId: string): Promise<Membership | null>;
    create(membership: Membership): Promise<Membership>;
}
//# sourceMappingURL=IMembershipRepository.d.ts.map