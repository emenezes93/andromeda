import type { AuthToken } from '@domain/entities/AuthToken.js';
import { Membership } from '@domain/entities/Membership.js';
import { RefreshToken } from '@domain/entities/RefreshToken.js';
import { User } from '@domain/entities/User.js';
import type { IUserRepository } from '@ports/repositories/IUserRepository.js';
import type { ITenantRepository } from '@ports/repositories/ITenantRepository.js';
import type { IRefreshTokenRepository } from '@ports/repositories/IRefreshTokenRepository.js';
import type { IPasswordService } from '@ports/services/IPasswordService.js';
import type { ITokenService } from '@ports/services/ITokenService.js';
import type { IAuditService } from '@ports/services/IAuditService.js';
import type { SeedDefaultTemplatesUseCase } from '@application/use-cases/anamnesis/templates/SeedDefaultTemplatesUseCase.js';
import { BadRequestError } from '@shared/errors/index.js';

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  tenantName: string;
}

export interface SignupResponse {
  token: AuthToken;
  refreshToken: RefreshToken;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    tenantId: string;
  };
}

export class SignupUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly tenantRepository: ITenantRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService,
    private readonly auditService: IAuditService,
    private readonly seedDefaultTemplatesUseCase: SeedDefaultTemplatesUseCase
  ) {}

  async execute(request: SignupRequest): Promise<SignupResponse> {
    const emailExists = await this.userRepository.exists(request.email);
    if (emailExists) {
      throw new BadRequestError('Email já cadastrado');
    }
    const tenantNameExists = await this.tenantRepository.existsByName(request.tenantName);
    if (tenantNameExists) {
      throw new BadRequestError('Nome da clínica/empresa já está em uso');
    }

    const passwordHash = await this.passwordService.hash(request.password);
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 14);

    const { tenantId, userId, ownerEmail, ownerName } = await this.tenantRepository.createWithOwner({
      name: request.tenantName,
      trialEndsAt,
      ownerEmail: request.email,
      ownerPasswordHash: passwordHash,
      ownerName: request.name.trim() || null,
    });

    const user = new User(userId, ownerEmail, passwordHash, ownerName, new Date(), null);
    const membership = Membership.create(userId, tenantId, 'owner', true);
    const accessToken = await this.tokenService.generateAccessToken(user, membership);
    const refreshTokenValue = await this.tokenService.generateRefreshToken();
    const refreshTokenExpiry = this.tokenService.calculateRefreshTokenExpiry();
    const refreshToken = RefreshToken.create(userId, tenantId, refreshTokenValue, refreshTokenExpiry);
    await this.refreshTokenRepository.create(refreshToken);

    await this.auditService.log(tenantId, 'signup', 'user', userId, userId, { email: ownerEmail });

    await this.seedDefaultTemplatesUseCase.execute(tenantId);

    return {
      token: accessToken,
      refreshToken,
      expiresIn: accessToken.expiresIn,
      user: {
        id: userId,
        email: ownerEmail,
        name: ownerName,
        role: 'owner',
        tenantId,
      },
    };
  }
}
