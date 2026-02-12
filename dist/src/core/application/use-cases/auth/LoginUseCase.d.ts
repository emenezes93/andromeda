import type { AuthToken } from '../../../domain/entities/AuthToken.js';
import { RefreshToken } from '../../../domain/entities/RefreshToken.js';
import type { IUserRepository } from '../../../ports/repositories/IUserRepository.js';
import type { IMembershipRepository } from '../../../ports/repositories/IMembershipRepository.js';
import type { ITenantRepository } from '../../../ports/repositories/ITenantRepository.js';
import type { IRefreshTokenRepository } from '../../../ports/repositories/IRefreshTokenRepository.js';
import type { IPasswordService } from '../../../ports/services/IPasswordService.js';
import type { ITokenService } from '../../../ports/services/ITokenService.js';
import type { IAuditService } from '../../../ports/services/IAuditService.js';
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
export declare class LoginUseCase {
    private readonly userRepository;
    private readonly membershipRepository;
    private readonly tenantRepository;
    private readonly refreshTokenRepository;
    private readonly passwordService;
    private readonly tokenService;
    private readonly auditService;
    constructor(userRepository: IUserRepository, membershipRepository: IMembershipRepository, tenantRepository: ITenantRepository, refreshTokenRepository: IRefreshTokenRepository, passwordService: IPasswordService, tokenService: ITokenService, auditService: IAuditService);
    execute(request: LoginRequest): Promise<LoginResponse>;
}
//# sourceMappingURL=LoginUseCase.d.ts.map