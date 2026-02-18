import type { User } from '@domain/entities/User.js';

/**
 * Port: User Repository Interface
 * Defines contract for user persistence
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(user: User): Promise<User>;
  exists(email: string): Promise<boolean>;
}
