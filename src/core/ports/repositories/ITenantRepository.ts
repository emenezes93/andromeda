import type { Tenant } from '@domain/entities/Tenant.js';

/**
 * Port: Tenant Repository Interface
 */
export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findAll(opts: { page: number; limit: number }): Promise<{ data: Tenant[]; total: number }>;
  create(data: { name: string; status?: string }): Promise<Tenant>;
  update(id: string, data: { name?: string; status?: string }): Promise<Tenant>;
  suspend(id: string): Promise<Tenant>;
  activate(id: string): Promise<Tenant>;
  existsByName(name: string): Promise<boolean>;
}
