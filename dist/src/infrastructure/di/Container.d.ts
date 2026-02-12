import type { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository.js';
import { PrismaMembershipRepository } from '../repositories/PrismaMembershipRepository.js';
import { PrismaTenantRepository } from '../repositories/PrismaTenantRepository.js';
import { PrismaRefreshTokenRepository } from '../repositories/PrismaRefreshTokenRepository.js';
import { BcryptPasswordService } from '../services/BcryptPasswordService.js';
import { JwtTokenService } from '../services/JwtTokenService.js';
import { PrismaAuditService } from '../services/PrismaAuditService.js';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase.js';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase.js';
import { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase.js';
import { RegisterUseCase } from '../../application/use-cases/auth/RegisterUseCase.js';
import { AuthController } from '../../presentation/controllers/AuthController.js';
/**
 * Dependency Injection Container
 * Composes all dependencies following hexagonal architecture
 */
export declare class Container {
    private readonly prisma;
    constructor(prisma: PrismaClient);
    private _userRepository?;
    get userRepository(): PrismaUserRepository;
    private _membershipRepository?;
    get membershipRepository(): PrismaMembershipRepository;
    private _tenantRepository?;
    get tenantRepository(): PrismaTenantRepository;
    private _refreshTokenRepository?;
    get refreshTokenRepository(): PrismaRefreshTokenRepository;
    private _passwordService?;
    get passwordService(): BcryptPasswordService;
    private _tokenService?;
    get tokenService(): JwtTokenService;
    private _auditService?;
    get auditService(): PrismaAuditService;
    private _loginUseCase?;
    get loginUseCase(): LoginUseCase;
    private _refreshTokenUseCase?;
    get refreshTokenUseCase(): RefreshTokenUseCase;
    private _logoutUseCase?;
    get logoutUseCase(): LogoutUseCase;
    private _registerUseCase?;
    get registerUseCase(): RegisterUseCase;
    private _authController?;
    get authController(): AuthController;
}
//# sourceMappingURL=Container.d.ts.map