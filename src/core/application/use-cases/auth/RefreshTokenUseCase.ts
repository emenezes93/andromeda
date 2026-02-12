import type { AuthToken } from '@domain/entities/AuthToken.js';
import { RefreshToken } from '@domain/entities/RefreshToken.js';
import type { IMembershipRepository } from '@ports/repositories/IMembershipRepository.js';
import type { ITenantRepository } from '@ports/repositories/ITenantRepository.js';
import type { IRefreshTokenRepository } from '@ports/repositories/IRefreshTokenRepository.js';
import type { IUserRepository } from '@ports/repositories/IUserRepository.js';
import type { ITokenService } from '@ports/services/ITokenService.js';
import { UnauthorizedError, ForbiddenError } from '@shared/errors/index.js';

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
export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userRepository: IUserRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly tokenService: ITokenService
  ) {}

  async execute(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    // Find refresh token
    const storedToken = await this.refreshTokenRepository.findByToken(request.refreshToken);
    if (!storedToken || !storedToken.isValid()) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // Verify membership still exists
    const membership = await this.membershipRepository.findByUserIdAndTenantId(
      storedToken.userId,
      storedToken.tenantId
    );
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

    const newRefreshToken = RefreshToken.create(
      storedToken.userId,
      storedToken.tenantId,
      newRefreshTokenValue,
      refreshTokenExpiry
    );
    await this.refreshTokenRepository.create(newRefreshToken);

    return {
      token: accessToken,
      refreshToken: newRefreshToken,
    };
  }
}
