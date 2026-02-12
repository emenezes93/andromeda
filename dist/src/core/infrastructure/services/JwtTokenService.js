import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { AuthToken } from '../../domain/entities/AuthToken.js';
/**
 * Adapter: JWT Token Service Implementation
 */
export class JwtTokenService {
    secret;
    ACCESS_TOKEN_EXPIRY = '15m';
    ACCESS_TOKEN_EXPIRY_SECONDS = 900;
    REFRESH_TOKEN_EXPIRY_DAYS = 30;
    constructor(secret) {
        this.secret = secret;
        if (!secret || secret.length < 32) {
            throw new Error('JWT_SECRET must be at least 32 characters');
        }
    }
    async generateAccessToken(user, membership) {
        const payload = {
            userId: user.id,
            email: user.email,
            role: membership.role,
            tenantId: membership.tenantId,
        };
        const token = jwt.sign(payload, this.secret, { expiresIn: this.ACCESS_TOKEN_EXPIRY });
        return new AuthToken(token, this.ACCESS_TOKEN_EXPIRY_SECONDS, user.id, user.email, membership.role, membership.tenantId);
    }
    async generateRefreshToken() {
        return crypto.randomUUID();
    }
    calculateRefreshTokenExpiry() {
        const date = new Date();
        date.setDate(date.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);
        return date;
    }
}
//# sourceMappingURL=JwtTokenService.js.map