import type { AuthToken } from '../../../domain/entities/AuthToken.js';
import type { RefreshToken } from '../../../domain/entities/RefreshToken.js';
import type { IMembershipRepository } from '../../../ports/repositories/IMembershipRepository.js';
import type { ITenantRepository } from '../../../ports/repositories/ITenantRepository.js';
import type { IRefreshTokenRepository } from '../../../ports/repositories/IRefreshTokenRepository.js';
import type { IUserRepository } from '../../../ports/repositories/IUserRepository.js';
import type { ITokenService } from '../../../ports/services/ITokenService.js';
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface RefreshTokenResponse {
    token: AuthToken;
    refreshToken: RefreshToken;
}
/**
 * Use Case: Refresh Access Token
 * Business logic for token refresh with rotation
 */
export declare class RefreshTokenUseCase {
    private readonly refreshTokenRepository;
    private readonly userRepository;
    private readonly membershipRepository;
    private readonly tenantRepository;
    private readonly tokenService;
    constructor(refreshTokenRepository: IRefreshTokenRepository, userRepository: IUserRepository, membershipRepository: IMembershipRepository, tenantRepository: ITenantRepository, tokenService: ITokenService);
    execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse>;
}
//# sourceMappingURL=RefreshTokenUseCase.d.ts.map