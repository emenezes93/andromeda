import type { AuthToken } from '../../domain/entities/AuthToken.js';
import type { Membership } from '../../domain/entities/Membership.js';
import type { User } from '../../domain/entities/User.js';
import type { ITokenService } from '../../ports/services/ITokenService.js';
/**
 * Adapter: JWT Token Service Implementation
 */
export declare class JwtTokenService implements ITokenService {
    private readonly secret;
    private readonly ACCESS_TOKEN_EXPIRY;
    private readonly ACCESS_TOKEN_EXPIRY_SECONDS;
    private readonly REFRESH_TOKEN_EXPIRY_DAYS;
    constructor(secret: string);
    generateAccessToken(user: User, membership: Membership): Promise<AuthToken>;
    generateRefreshToken(): Promise<string>;
    calculateRefreshTokenExpiry(): Date;
}
//# sourceMappingURL=JwtTokenService.d.ts.map