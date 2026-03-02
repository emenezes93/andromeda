import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireAuth } from '@http/middleware/auth.js';
import { setupTwoFactorBodySchema, disableTwoFactorBodySchema } from './schemas.js';
import { loginWithTwoFactorBodySchema } from './schemas.js';
import {
  generateTwoFactorSecret,
  generateBackupCodes,
  hashBackupCode,
  generateQRCodeUrl,
  verifyTotpToken,
  verifyBackupCode,
} from './two-factor.js';
import { UnauthorizedError, BadRequestError } from '@shared/errors/index.js';
import { RefreshToken } from '@domain/entities/RefreshToken.js';

interface TwoFactorStatusResponse {
  enabled: boolean;
}

interface TwoFactorSetupStartResponse {
  qrCodeUrl: string;
  backupCodes: string[];
}

export async function twoFactorRoutes(app: FastifyInstance): Promise<void> {
  app.get<{
    Reply: TwoFactorStatusResponse;
  }>('/v1/auth/2fa/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const dbUser = await app.prisma.user.findUnique({
      where: { id: user.userId },
      select: { twoFactorEnabled: true },
    });
    await reply.status(200).send({
      enabled: dbUser?.twoFactorEnabled ?? false,
    });
  });

  app.post<{
    Reply: TwoFactorSetupStartResponse;
  }>('/v1/auth/2fa/setup/start', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = requireAuth(request);
    const dbUser = await app.prisma.user.findUnique({
      where: { id: user.userId },
      select: { email: true },
    });
    if (!dbUser) throw new UnauthorizedError('User not found');

    const tenant = await app.prisma.membership.findFirst({
      where: { userId: user.userId },
      include: { tenant: true },
    });
    const tenantName = tenant?.tenant?.name ?? 'Organização';

    const generated = generateTwoFactorSecret(dbUser.email, tenantName);
    const secret = generated.base32;
    const otpauthUrl = generated.otpauth_url;
    if (!secret || !otpauthUrl) {
      throw new BadRequestError('Failed to generate 2FA secret');
    }
    const backupCodes = generateBackupCodes(8);
    const qrCodeUrl = await generateQRCodeUrl(otpauthUrl);

    await app.prisma.user.update({
      where: { id: user.userId },
      data: {
        twoFactorSecret: secret,
        twoFactorEnabled: false,
        twoFactorBackupCodes: backupCodes.map((c) => hashBackupCode(c)),
      },
    });

    await reply.status(200).send({ qrCodeUrl, backupCodes });
  });

  app.post(
    '/v1/auth/2fa/setup/verify',
    {
      schema: {
        body: { $ref: 'SetupTwoFactorBody#' },
        response: { 200: { type: 'object', properties: { ok: { type: 'boolean' } } } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = requireAuth(request);
      const body = setupTwoFactorBodySchema.parse(request.body);

      const dbUser = await app.prisma.user.findUnique({
        where: { id: user.userId },
        select: { twoFactorSecret: true },
      });
      if (!dbUser?.twoFactorSecret) {
        throw new BadRequestError('2FA setup not started. Call /2fa/setup/start first.');
      }

      const valid = verifyTotpToken(dbUser.twoFactorSecret, body.token);
      if (!valid) {
        throw new UnauthorizedError('Código inválido ou expirado.');
      }

      await app.prisma.user.update({
        where: { id: user.userId },
        data: { twoFactorEnabled: true },
      });

      await reply.status(200).send({ ok: true });
    }
  );

  app.post(
    '/v1/auth/2fa/disable',
    {
      schema: {
        body: { $ref: 'DisableTwoFactorBody#' },
        response: { 200: { type: 'object', properties: { ok: { type: 'boolean' } } } },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const user = requireAuth(request);
      const body = disableTwoFactorBodySchema.parse(request.body);

      const dbUser = await app.prisma.user.findUnique({
        where: { id: user.userId },
        select: { passwordHash: true },
      });
      if (!dbUser) throw new UnauthorizedError('User not found');

      const container = (app as FastifyInstance & { container: { passwordService: { compare: (a: string, b: string) => Promise<boolean> } } }).container;
      const match = await container.passwordService.compare(body.password, dbUser.passwordHash);
      if (!match) {
        throw new UnauthorizedError('Senha incorreta.');
      }

      await app.prisma.user.update({
        where: { id: user.userId },
        data: {
          twoFactorSecret: null,
          twoFactorEnabled: false,
          twoFactorBackupCodes: [],
        },
      });

      await reply.status(200).send({ ok: true });
    }
  );

  app.post<{
    Body: { email: string; password: string; twoFactorCode?: string; backupCode?: string };
  }>(
    '/v1/auth/login-2fa',
    {
      config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
      schema: {
        body: { $ref: 'LoginWithTwoFactorBody#' },
        response: {
          200: {
            type: 'object',
            properties: {
              requiresTwoFactor: { type: 'boolean' },
              token: { type: 'string' },
              refreshToken: { type: 'string' },
              expiresIn: { type: 'number' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  email: { type: 'string' },
                  name: { type: 'string', nullable: true },
                  role: { type: 'string' },
                  tenantId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const body = loginWithTwoFactorBodySchema.parse(request.body);
      type AppWithContainer = FastifyInstance & {
        container: {
          passwordService: { compare: (a: string, b: string) => Promise<boolean> };
          userRepository: { recordFailedLogin: (id: string) => Promise<void>; recordSuccessfulLogin: (id: string) => Promise<void>; findById: (id: string) => Promise<import('@domain/entities/User.js').User | null> };
          membershipRepository: { findByUserId: (id: string) => Promise<import('@domain/entities/Membership.js').Membership | null> };
          tokenService: { generateAccessToken: (u: unknown, m: unknown) => Promise<{ token: string; expiresIn: number }>; generateRefreshToken: () => Promise<string>; calculateRefreshTokenExpiry: () => Date };
          refreshTokenRepository: { create: (r: RefreshToken) => Promise<void> };
        };
      };
      const container = (app as AppWithContainer).container;

      const dbUser = await app.prisma.user.findUnique({
        where: { email: body.email },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true,
          twoFactorEnabled: true,
          twoFactorSecret: true,
          loginAttempts: true,
          lockedUntil: true,
          deletedAt: true,
        },
      });

      if (
        !dbUser ||
        dbUser.deletedAt ||
        (dbUser.lockedUntil && new Date(dbUser.lockedUntil) > new Date())
      ) {
        throw new UnauthorizedError('E-mail, senha ou código inválidos.');
      }

      const passwordMatch = await container.passwordService.compare(
        body.password,
        dbUser.passwordHash
      );
      if (!passwordMatch) {
        await container.userRepository.recordFailedLogin(dbUser.id);
        throw new UnauthorizedError('E-mail, senha ou código inválidos.');
      }

      if (!dbUser.twoFactorEnabled || !dbUser.twoFactorSecret) {
        throw new UnauthorizedError('2FA não está ativo para esta conta.');
      }

      const code = body.twoFactorCode?.trim() ?? body.backupCode?.trim();
      if (!code) {
        await reply.status(200).send({ requiresTwoFactor: true });
        return;
      }

      let codeValid = false;
      if (body.twoFactorCode?.trim()) {
        codeValid = verifyTotpToken(dbUser.twoFactorSecret, body.twoFactorCode.trim());
      } else if (body.backupCode?.trim()) {
        codeValid = await verifyBackupCode(app.prisma, dbUser.id, body.backupCode.trim());
      }

      if (!codeValid) {
        throw new UnauthorizedError('Código inválido ou expirado.');
      }

      await container.userRepository.recordSuccessfulLogin(dbUser.id);

      const user = await container.userRepository.findById(dbUser.id);
      const membership = await container.membershipRepository.findByUserId(dbUser.id);
      if (!user || !membership) {
        throw new UnauthorizedError('Usuário ou organização não encontrados.');
      }

      const accessToken = await container.tokenService.generateAccessToken(user, membership);
      const refreshTokenValue = await container.tokenService.generateRefreshToken();
      const refreshTokenExpiry = container.tokenService.calculateRefreshTokenExpiry();
      const refreshToken = RefreshToken.create(
        user.id,
        membership.tenantId,
        refreshTokenValue,
        refreshTokenExpiry
      );
      await container.refreshTokenRepository.create(refreshToken);

      await reply.status(200).send({
        token: accessToken.token,
        refreshToken: refreshToken.token,
        expiresIn: accessToken.expiresIn,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: membership.role,
          tenantId: membership.tenantId,
        },
      });
    }
  );
}
