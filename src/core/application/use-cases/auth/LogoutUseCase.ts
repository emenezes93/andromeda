import type { IRefreshTokenRepository } from '@ports/repositories/IRefreshTokenRepository.js';

export interface LogoutRequest {
  refreshToken: string;
}

/**
 * Use Case: Logout
 * Business logic for revoking refresh tokens
 */
export class LogoutUseCase {
  constructor(private readonly refreshTokenRepository: IRefreshTokenRepository) {}

  async execute(request: LogoutRequest): Promise<void> {
    await this.refreshTokenRepository.revokeByToken(request.refreshToken);
  }
}
