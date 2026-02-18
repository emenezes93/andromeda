import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { AuthToken } from '@domain/entities/AuthToken.js';
import type { Membership } from '@domain/entities/Membership.js';
import type { User } from '@domain/entities/User.js';
import type { ITokenService } from '@ports/services/ITokenService.js';

/**
 * Adapter: JWT Token Service Implementation
 */
export class JwtTokenService implements ITokenService {
  private readonly ACCESS_TOKEN_EXPIRY = '15m';
  private readonly ACCESS_TOKEN_EXPIRY_SECONDS = 900;
  private readonly REFRESH_TOKEN_EXPIRY_DAYS = 30;

  constructor(private readonly secret: string) {
    if (!secret || secret.length < 32) {
      throw new Error('JWT_SECRET must be at least 32 characters');
    }
  }

  async generateAccessToken(user: User, membership: Membership): Promise<AuthToken> {
    const payload = {
      userId: user.id,
      email: user.email,
      role: membership.role,
      tenantId: membership.tenantId,
    };

    const token = jwt.sign(payload, this.secret, { expiresIn: this.ACCESS_TOKEN_EXPIRY });

    return new AuthToken(
      token,
      this.ACCESS_TOKEN_EXPIRY_SECONDS,
      user.id,
      user.email,
      membership.role,
      membership.tenantId
    );
  }

  async generateRefreshToken(): Promise<string> {
    return crypto.randomUUID();
  }

  calculateRefreshTokenExpiry(): Date {
    const date = new Date();
    date.setDate(date.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);
    return date;
  }
}
