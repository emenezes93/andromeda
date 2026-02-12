/**
 * Use Case: Logout
 * Business logic for revoking refresh tokens
 */
export class LogoutUseCase {
    refreshTokenRepository;
    constructor(refreshTokenRepository) {
        this.refreshTokenRepository = refreshTokenRepository;
    }
    async execute(request) {
        await this.refreshTokenRepository.revokeByToken(request.refreshToken);
    }
}
//# sourceMappingURL=LogoutUseCase.js.map