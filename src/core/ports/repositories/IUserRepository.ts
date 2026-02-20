import type { User } from '@domain/entities/User.js';

/**
 * Port: User Repository Interface
 * Defines contract for user persistence
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAll(
    tenantId: string,
    opts: { page: number; limit: number; active?: boolean }
  ): Promise<{ data: User[]; total: number }>;
  findByIdInTenant(id: string, tenantId: string): Promise<User | null>;
  create(user: User): Promise<User>;
  createWithMembership(data: {
    email: string;
    passwordHash: string;
    name: string | null;
    tenantId: string;
    role: string;
  }): Promise<User>;
  update(
    id: string,
    tenantId: string,
    data: { name?: string; email?: string; passwordHash?: string }
  ): Promise<User>;
  softDelete(id: string, tenantId: string): Promise<void>;
  exists(email: string): Promise<boolean>;
  recordFailedLogin(userId: string): Promise<void>;
  recordSuccessfulLogin(userId: string): Promise<void>;
}
