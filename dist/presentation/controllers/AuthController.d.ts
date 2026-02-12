import type { FastifyInstance } from 'fastify';
import { LoginUseCase } from '../../application/use-cases/auth/LoginUseCase.js';
import { RefreshTokenUseCase } from '../../application/use-cases/auth/RefreshTokenUseCase.js';
import { LogoutUseCase } from '../../application/use-cases/auth/LogoutUseCase.js';
import { RegisterUseCase } from '../../application/use-cases/auth/RegisterUseCase.js';
/**
 * Presentation Layer: Auth Controller
 * Handles HTTP requests/responses, delegates to use cases
 */
export declare class AuthController {
    private readonly loginUseCase;
    private readonly refreshTokenUseCase;
    private readonly logoutUseCase;
    private readonly registerUseCase;
    constructor(loginUseCase: LoginUseCase, refreshTokenUseCase: RefreshTokenUseCase, logoutUseCase: LogoutUseCase, registerUseCase: RegisterUseCase);
    registerRoutes(app: FastifyInstance): void;
    private login;
    private refresh;
    private logout;
    private register;
}
//# sourceMappingURL=AuthController.d.ts.map