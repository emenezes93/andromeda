import { UnauthorizedError, ForbiddenError } from '../../../shared/errors.js';
/**
 * Use Case: Login
 * Business logic for user authentication
 */
export class LoginUseCase {
    userRepository;
    membershipRepository;
    tenantRepository;
    refreshTokenRepository;
    passwordService;
    tokenService;
    auditService;
    constructor(userRepository, membershipRepository, tenantRepository, refreshTokenRepository, passwordService, tokenService, auditService) {
        this.userRepository = userRepository;
        this.membershipRepository = membershipRepository;
        this.tenantRepository = tenantRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.passwordService = passwordService;
        this.tokenService = tokenService;
        this.auditService = auditService;
    }
    async execute(request) {
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
//# sourceMappingURL=LoginUseCase.js.map