import type { AuthToken } from '@domain/entities/AuthToken.js';
import type { Membership } from '@domain/entities/Membership.js';
import type { User } from '@domain/entities/User.js';

/**
 * Port: Token Service Interface
 * Abstracts JWT token generation
 */
export interface ITokenService {
  generateAccessToken(user: User, membership: Membership): Promise<AuthToken>;
  generateRefreshToken(): Promise<string>;
  calculateRefreshTokenExpiry(): Date;
}
