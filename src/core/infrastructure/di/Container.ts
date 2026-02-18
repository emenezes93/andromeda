import type { PrismaClient } from '@prisma/client';
import { PrismaUserRepository } from '../repositories/PrismaUserRepository.js';
import { PrismaMembershipRepository } from '../repositories/PrismaMembershipRepository.js';
import { PrismaTenantRepository } from '../repositories/PrismaTenantRepository.js';
import { PrismaRefreshTokenRepository } from '../repositories/PrismaRefreshTokenRepository.js';
import { BcryptPasswordService } from '../services/BcryptPasswordService.js';
import { JwtTokenService } from '../services/JwtTokenService.js';
import { PrismaAuditService } from '../services/PrismaAuditService.js';
import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase.js';
import { RefreshTokenUseCase } from '@application/use-cases/auth/RefreshTokenUseCase.js';
import { LogoutUseCase } from '@application/use-cases/auth/LogoutUseCase.js';
import { RegisterUseCase } from '@application/use-cases/auth/RegisterUseCase.js';
import { AuthController } from '@presentation/controllers/AuthController.js';
import { env } from '@config/env.js';

/**
 * Dependency Injection Container
 * Composes all dependencies following hexagonal architecture
 */
export class Container {
  constructor(private readonly prisma: PrismaClient) {}

  // Repositories
  private _userRepository?: PrismaUserRepository;
  get userRepository(): PrismaUserRepository {
    if (!this._userRepository) {
      this._userRepository = new PrismaUserRepository(this.prisma);
    }
    return this._userRepository;
  }

  private _membershipRepository?: PrismaMembershipRepository;
  get membershipRepository(): PrismaMembershipRepository {
    if (!this._membershipRepository) {
      this._membershipRepository = new PrismaMembershipRepository(this.prisma);
    }
    return this._membershipRepository;
  }

  private _tenantRepository?: PrismaTenantRepository;
  get tenantRepository(): PrismaTenantRepository {
    if (!this._tenantRepository) {
      this._tenantRepository = new PrismaTenantRepository(this.prisma);
    }
    return this._tenantRepository;
  }

  private _refreshTokenRepository?: PrismaRefreshTokenRepository;
  get refreshTokenRepository(): PrismaRefreshTokenRepository {
    if (!this._refreshTokenRepository) {
      this._refreshTokenRepository = new PrismaRefreshTokenRepository(this.prisma);
    }
    return this._refreshTokenRepository;
  }

  // Services
  private _passwordService?: BcryptPasswordService;
  get passwordService(): BcryptPasswordService {
    if (!this._passwordService) {
      this._passwordService = new BcryptPasswordService();
    }
    return this._passwordService;
  }

  private _tokenService?: JwtTokenService;
  get tokenService(): JwtTokenService {
    if (!this._tokenService) {
      this._tokenService = new JwtTokenService(env.JWT_SECRET);
    }
    return this._tokenService;
  }

  private _auditService?: PrismaAuditService;
  get auditService(): PrismaAuditService {
    if (!this._auditService) {
      this._auditService = new PrismaAuditService(this.prisma);
    }
    return this._auditService;
  }

  // Use Cases
  private _loginUseCase?: LoginUseCase;
  get loginUseCase(): LoginUseCase {
    if (!this._loginUseCase) {
      this._loginUseCase = new LoginUseCase(
        this.userRepository,
        this.membershipRepository,
        this.tenantRepository,
        this.refreshTokenRepository,
        this.passwordService,
        this.tokenService,
        this.auditService
      );
    }
    return this._loginUseCase;
  }

  private _refreshTokenUseCase?: RefreshTokenUseCase;
  get refreshTokenUseCase(): RefreshTokenUseCase {
    if (!this._refreshTokenUseCase) {
      this._refreshTokenUseCase = new RefreshTokenUseCase(
        this.refreshTokenRepository,
        this.userRepository,
        this.membershipRepository,
        this.tenantRepository,
        this.tokenService
      );
    }
    return this._refreshTokenUseCase;
  }

  private _logoutUseCase?: LogoutUseCase;
  get logoutUseCase(): LogoutUseCase {
    if (!this._logoutUseCase) {
      this._logoutUseCase = new LogoutUseCase(this.refreshTokenRepository);
    }
    return this._logoutUseCase;
  }

  private _registerUseCase?: RegisterUseCase;
  get registerUseCase(): RegisterUseCase {
    if (!this._registerUseCase) {
      this._registerUseCase = new RegisterUseCase(
        this.userRepository,
        this.membershipRepository,
        this.passwordService
      );
    }
    return this._registerUseCase;
  }

  // Controllers
  private _authController?: AuthController;
  get authController(): AuthController {
    if (!this._authController) {
      this._authController = new AuthController(
        this.loginUseCase,
        this.refreshTokenUseCase,
        this.logoutUseCase,
        this.registerUseCase
      );
    }
    return this._authController;
  }
}
