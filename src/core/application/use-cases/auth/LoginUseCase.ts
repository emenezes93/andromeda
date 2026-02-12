import type { AuthToken } from '@domain/entities/AuthToken.js';
import { RefreshToken } from '@domain/entities/RefreshToken.js';
import type { IUserRepository } from '@ports/repositories/IUserRepository.js';
import type { IMembershipRepository } from '@ports/repositories/IMembershipRepository.js';
import type { ITenantRepository } from '@ports/repositories/ITenantRepository.js';
import type { IRefreshTokenRepository } from '@ports/repositories/IRefreshTokenRepository.js';
import type { IPasswordService } from '@ports/services/IPasswordService.js';
import type { ITokenService } from '@ports/services/ITokenService.js';
import type { IAuditService } from '@ports/services/IAuditService.js';
import { UnauthorizedError, ForbiddenError } from '@shared/errors/index.js';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: AuthToken;
  refreshToken: RefreshToken;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    tenantId: string;
  };
}

/**
 * Use Case: Login
 * Business logic for user authentication
 */
export class LoginUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly membershipRepository: IMembershipRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: LoginRequest): Promise<LoginResponse> {
    // Find user
    const user = await this.userRepository.findByEmail(request.email);
    if (!user || user.isDeleted()) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const passwordMatch = await this.passwordService.compare(request.password, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Find membership
    const membership = await this.membershipRepository.findByUserId(user.id);
    if (!membership) {
      throw new UnauthorizedError('User has no tenant membership');
    }

    // Verify tenant is active
    const tenant = await this.tenantRepository.findById(membership.tenantId);
    if (!tenant || !tenant.isActive()) {
      throw new ForbiddenError('Tenant is not active');
    }

    // Generate tokens
    const accessToken = await this.tokenService.generateAccessToken(user, membership);
    const refreshTokenValue = await this.tokenService.generateRefreshToken();
    const refreshTokenExpiry = this.tokenService.calculateRefreshTokenExpiry();

    // Create refresh token entity
    const refreshToken = RefreshToken.create(user.id, membership.tenantId, refreshTokenValue, refreshTokenExpiry);
    await this.refreshTokenRepository.create(refreshToken);

    // Audit log
    await this.auditService.log(membership.tenantId, 'login', 'user', user.id, user.id, { email: user.email });

    return {
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: membership.role,
        tenantId: membership.tenantId,
      },
    };
  }
}
