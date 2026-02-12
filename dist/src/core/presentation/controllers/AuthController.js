import { loginBodySchema, registerBodySchema, refreshBodySchema, logoutBodySchema } from '../../../modules/auth/schemas.js';
import { requireTenant } from '../../../http/middleware/tenant.js';
import { requireAuth } from '../../../http/middleware/auth.js';
import { Guards } from '../../../shared/utils/rbac.js';
/**
 * Presentation Layer: Auth Controller
 * Handles HTTP requests/responses, delegates to use cases
 */
export class AuthController {
    loginUseCase;
    refreshTokenUseCase;
    logoutUseCase;
    registerUseCase;
    constructor(loginUseCase, refreshTokenUseCase, logoutUseCase, registerUseCase) {
        this.loginUseCase = loginUseCase;
        this.refreshTokenUseCase = refreshTokenUseCase;
        this.logoutUseCase = logoutUseCase;
        this.registerUseCase = registerUseCase;
    }
    registerRoutes(app) {
        app.post('/v1/auth/login', {
            config: { rateLimit: { max: Number(process.env.RATE_LIMIT_AUTH) || 10, timeWindow: '1 minute' } },
            schema: {
                body: { $ref: 'LoginBody#' },
                response: { 200: { $ref: 'LoginResponse#' } },
            },
        }, this.login.bind(this));
        app.post('/v1/auth/refresh', {
            config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
            schema: {
                body: { $ref: 'RefreshBody#' },
                response: { 200: { $ref: 'RefreshResponse#' } },
            },
        }, this.refresh.bind(this));
        app.post('/v1/auth/logout', {
            schema: {
                body: { $ref: 'LogoutBody#' },
                response: { 204: { type: 'null' } },
            },
        }, this.logout.bind(this));
        app.post('/v1/auth/register', {
            schema: {
                body: { $ref: 'RegisterBody#' },
                headers: { 'x-tenant-id': { type: 'string' } },
                response: { 201: { $ref: 'UserResponse#' } },
            },
        }, this.register.bind(this));
    }
    async login(request, reply) {
        const body = loginBodySchema.parse(request.body);
        const result = await this.loginUseCase.execute({ email: body.email, password: body.password });
        await reply.status(200).send({
            token: result.token.token,
            refreshToken: result.refreshToken.token,
            expiresIn: result.token.expiresIn,
            user: result.user,
        });
    }
    async refresh(request, reply) {
        const body = refreshBodySchema.parse(request.body);
        const result = await this.refreshTokenUseCase.execute({ refreshToken: body.refreshToken });
        await reply.status(200).send({
            token: result.token.token,
            refreshToken: result.refreshToken.token,
            expiresIn: result.token.expiresIn,
        });
    }
    async logout(request, reply) {
        const body = logoutBodySchema.parse(request.body);
        await this.logoutUseCase.execute({ refreshToken: body.refreshToken });
        await reply.status(204).send();
    }
    async register(request, reply) {
        const tenantId = requireTenant(request);
        const user = requireAuth(request);
        Guards.tenants(user.role);
        const body = registerBodySchema.parse(request.body);
        const result = await this.registerUseCase.execute({
            email: body.email,
            password: body.password,
            name: body.name ?? null,
            tenantId,
        });
        await reply.status(201).send({
            id: result.id,
            email: result.email,
            name: result.name,
        });
    }
}
//# sourceMappingURL=AuthController.js.map