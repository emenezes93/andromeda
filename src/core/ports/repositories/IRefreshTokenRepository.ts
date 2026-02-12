import type { RefreshToken } from '@domain/entities/RefreshToken.js';

/**
 * Port: RefreshToken Repository Interface
 */
export interface IRefreshTokenRepository {
  findByToken(token: string): Promise<RefreshToken | null>;
  create(token: RefreshToken): Promise<RefreshToken>;
  revoke(token: RefreshToken): Promise<void>;
  revokeByToken(token: string): Promise<void>;
  deleteExpired(): Promise<number>;
}
