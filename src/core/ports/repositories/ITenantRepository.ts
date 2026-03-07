import type { Tenant } from '@domain/entities/Tenant.js';

/**
 * Port: Tenant Repository Interface
 */
export interface TenantWithOwnerResult {
  tenantId: string;
  userId: string;
  ownerEmail: string;
  ownerName: string | null;
}

export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findAll(opts: { page: number; limit: number }): Promise<{ data: Tenant[]; total: number }>;
  create(data: { name: string; status?: string; trialEndsAt?: Date }): Promise<Tenant>;
  createWithOwner(data: {
    name: string;
    trialEndsAt: Date;
    ownerEmail: string;
    ownerPasswordHash: string;
    ownerName: string | null;
  }): Promise<TenantWithOwnerResult>;
  update(
    id: string,
    data: {
      name?: string;
      status?: string;
      emailAlertsEnabled?: boolean;
      logoUrl?: string | null;
      brandColor?: string | null;
    }
  ): Promise<Tenant>;
  suspend(id: string): Promise<Tenant>;
  activate(id: string): Promise<Tenant>;
  existsByName(name: string): Promise<boolean>;
}
