import type { Tenant } from '@domain/entities/Tenant.js';

/**
 * Port: Tenant Repository Interface
 */
export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  create(tenant: Tenant): Promise<Tenant>;
}
