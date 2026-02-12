import type { IRefreshTokenRepository } from '../../../ports/repositories/IRefreshTokenRepository.js';
export interface LogoutRequest {
    refreshToken: string;
}
/**
 * Use Case: Logout
 * Business logic for revoking refresh tokens
 */
export declare class LogoutUseCase {
    private readonly refreshTokenRepository;
    constructor(refreshTokenRepository: IRefreshTokenRepository);
    execute(request: LogoutRequest): Promise<void>;
}
//# sourceMappingURL=LogoutUseCase.d.ts.map