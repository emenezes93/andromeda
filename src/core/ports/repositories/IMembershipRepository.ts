import type { User } from '@domain/entities/User.js';
import type { Membership } from '@domain/entities/Membership.js';

export interface MemberWithUser {
  membership: Membership;
  user: User;
}

/**
 * Port: Membership Repository Interface
 */
export interface IMembershipRepository {
  findByUserId(userId: string): Promise<Membership | null>;
  findByUserIdAndTenantId(userId: string, tenantId: string): Promise<Membership | null>;
  findAllByTenantId(
    tenantId: string,
    opts: { page: number; limit: number; active?: boolean }
  ): Promise<{ data: MemberWithUser[]; total: number }>;
  create(membership: Membership): Promise<Membership>;
  updateRole(membershipId: string, role: string): Promise<Membership>;
  setActive(membershipId: string, active: boolean): Promise<Membership>;
  deleteByUserIdAndTenantId(userId: string, tenantId: string): Promise<void>;
}
