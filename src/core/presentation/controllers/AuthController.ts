import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { loginBodySchema, registerBodySchema, refreshBodySchema, logoutBodySchema } from '../../../modules/auth/schemas.js';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { LoginUseCase } from '@application/use-cases/auth/LoginUseCase.js';
import { RefreshTokenUseCase } from '@application/use-cases/auth/RefreshTokenUseCase.js';
import { LogoutUseCase } from '@application/use-cases/auth/LogoutUseCase.js';
import { RegisterUseCase } from '@application/use-cases/auth/RegisterUseCase.js';

/**
 * Presentation Layer: Auth Controller
 * Handles HTTP requests/responses, delegates to use cases
 */
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly registerUseCase: RegisterUseCase
  ) {}

  registerRoutes(app: FastifyInstance): void {
    app.post(
      '/v1/auth/login',
      {
        config: { rateLimit: { max: Number(process.env.RATE_LIMIT_AUTH) || 10, timeWindow: '1 minute' } },
        schema: {
          body: { $ref: 'LoginBody#' },
          response: { 200: { $ref: 'LoginResponse#' } },
        },
      },
      this.login.bind(this)
    );

    app.post(
      '/v1/auth/refresh',
      {
        config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
        schema: {
          body: { $ref: 'RefreshBody#' },
          response: { 200: { $ref: 'RefreshResponse#' } },
        },
      },
      this.refresh.bind(this)
    );

    app.post(
      '/v1/auth/logout',
      {
        schema: {
          body: { $ref: 'LogoutBody#' },
          response: { 204: { type: 'null' } },
        },
      },
      this.logout.bind(this)
    );

    app.post(
      '/v1/auth/register',
      {
        schema: {
          body: {
            type: 'object',
            required: ['email', 'password'],
            properties: {
              email: { type: 'string', format: 'email' },
              password: { type: 'string', minLength: 8 },
              name: { type: 'string' },
            },
            additionalProperties: false,
          },
          headers: {
            type: 'object',
            required: ['x-tenant-id'],
            properties: { 'x-tenant-id': { type: 'string' } },
          },
          response: { 201: { $ref: 'UserResponse#' } },
        },
      },
      this.register.bind(this)
    );
  }

  private async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = loginBodySchema.parse(request.body);
    const result = await this.loginUseCase.execute({ email: body.email, password: body.password });

    await reply.status(200).send({
      token: result.token.token,
      refreshToken: result.refreshToken.token,
      expiresIn: result.token.expiresIn,
      user: result.user,
    });
  }

  private async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = refreshBodySchema.parse(request.body);
    const result = await this.refreshTokenUseCase.execute({ refreshToken: body.refreshToken });

    await reply.status(200).send({
      token: result.token.token,
      refreshToken: result.refreshToken.token,
      expiresIn: result.token.expiresIn,
    });
  }

  private async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = logoutBodySchema.parse(request.body);
    await this.logoutUseCase.execute({ refreshToken: body.refreshToken });
    await reply.status(204).send();
  }

  private async register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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
