import { RefreshToken } from '../../../domain/entities/RefreshToken.js';
import { UnauthorizedError, ForbiddenError } from '../../../../shared/errors/index.js';
/**
 * Use Case: Refresh Access Token
 * Business logic for token refresh with rotation
 */
export class RefreshTokenUseCase {
    refreshTokenRepository;
    userRepository;
    membershipRepository;
    tenantRepository;
    tokenService;
    constructor(refreshTokenRepository, userRepository, membershipRepository, tenantRepository, tokenService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.tenantRepository = tenantRepository;
        this.tokenService = tokenService;
    }
    async execute(request) {
        // Find refresh token
        const storedToken = await this.refreshTokenRepository.findByToken(request.refreshToken);
        if (!storedToken || !storedToken.isValid()) {
            throw new UnauthorizedError('Invalid or expired refresh token');
        }
        // Verify membership still exists
        const membership = await this.membershipRepository.findByUserIdAndTenantId(storedToken.userId, storedToken.tenantId);
        if (!membership) {
            throw new UnauthorizedError('User has no tenant membership');
        }
        // Verify tenant is active
        const tenant = await this.tenantRepository.findById(storedToken.tenantId);
        if (!tenant || !tenant.isActive()) {
            throw new ForbiddenError('Tenant is not active');
        }
        // Get user
        const user = await this.userRepository.findById(storedToken.userId);
        if (!user || user.isDeleted()) {
            throw new UnauthorizedError('User not found');
        }
        // Generate new tokens
        const accessToken = await this.tokenService.generateAccessToken(user, membership);
        const newRefreshTokenValue = await this.tokenService.generateRefreshToken();
        const refreshTokenExpiry = this.tokenService.calculateRefreshTokenExpiry();
        // Rotate refresh token (revoke old, create new)
        const revokedToken = storedToken.revoke();
        await this.refreshTokenRepository.revoke(revokedToken);
        const newRefreshToken = RefreshToken.create(storedToken.userId, storedToken.tenantId, newRefreshTokenValue, refreshTokenExpiry);
        await this.refreshTokenRepository.create(newRefreshToken);
        return {
            token: accessToken,
            refreshToken: newRefreshToken,
        };
    }
}
//# sourceMappingURL=RefreshTokenUseCase.js.map