import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  loginBodySchema,
  registerBodySchema,
  refreshBodySchema,
  logoutBodySchema,
  changePasswordBodySchema,
  loginWithTwoFactorBodySchema,
  setupTwoFactorBodySchema,
  disableTwoFactorBodySchema,
} from './schemas.js';
import { UnauthorizedError, ForbiddenError, BadRequestError } from '@shared/errors/index.js';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards, requireOneOfRoles } from '@shared/utils/rbac.js';
import { env } from '@config/env.js';
import { auditLog } from '@shared/utils/audit.js';
import {
  checkPasswordHistory,
  savePasswordHistory,
  calculatePasswordExpiry,
  isPasswordExpired,
  PASSWORD_HISTORY_LIMIT,
} from './password-policy.js';
import {
  generateTwoFactorSecret,
  generateBackupCodes,
  hashBackupCode,
  verifyTotpToken,
  verifyBackupCode,
  generateQRCodeUrl,
} from './two-factor.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const ACCESS_TOKEN_EXPIRY_SECONDS = 900;
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

function refreshTokenExpiresAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return date;
}

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/v1/auth/login',
    {
      config: {
        rateLimit: { max: Number(process.env.RATE_LIMIT_AUTH) || 10, timeWindow: '1 minute' },
      },
      schema: {
        body: { $ref: 'LoginBody#' },
        response: { 200: { $ref: 'LoginResponse#' } },
      },
    },
    async (request, reply) => {
      const body = loginBodySchema.parse(request.body);
      const user = await fastify.prisma.user.findUnique({ where: { email: body.email } });
      if (!user) throw new UnauthorizedError('Invalid email or password');

      const match = await bcrypt.compare(body.password, user.passwordHash);
      if (!match) throw new UnauthorizedError('Invalid email or password');

      const membership = await fastify.prisma.membership.findFirst({
        where: { userId: user.id },
        include: { tenant: true },
      });
      if (!membership) throw new UnauthorizedError('User has no tenant membership');

      if (membership.tenant.status !== 'active') throw new ForbiddenError('Tenant is not active');
      if (!membership.active) throw new ForbiddenError('User account is deactivated');

      // Check password expiration
      if (isPasswordExpired(user.passwordExpiresAt)) {
        throw new ForbiddenError('Password has expired. Please change your password.');
      }

      // Check 2FA if enabled (only for owner/admin roles)
      if (user.twoFactorEnabled && (membership.role === 'owner' || membership.role === 'admin')) {
        throw new BadRequestError('2FA is enabled. Please use /v1/auth/login-2fa endpoint.');
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: membership.role,
          tenantId: membership.tenantId,
        },
        env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      const refreshToken = crypto.randomUUID();
      await fastify.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tenantId: membership.tenantId,
          token: refreshToken,
          expiresAt: refreshTokenExpiresAt(),
        },
      });

      await auditLog(fastify.prisma, membership.tenantId, 'login', 'user', user.id, user.id, {
        email: user.email,
      });

      return reply.status(200).send({
        token,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
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

  fastify.post(
    '/v1/auth/refresh',
    {
      config: { rateLimit: { max: 5, timeWindow: '1 minute' } },
      schema: {
        body: { $ref: 'RefreshBody#' },
        response: { 200: { $ref: 'RefreshResponse#' } },
      },
    },
    async (request, reply) => {
      const body = refreshBodySchema.parse(request.body);

      const stored = await fastify.prisma.refreshToken.findUnique({
        where: { token: body.refreshToken },
      });

      if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
        throw new UnauthorizedError('Invalid or expired refresh token');
      }

      const membership = await fastify.prisma.membership.findFirst({
        where: { userId: stored.userId, tenantId: stored.tenantId },
        include: { tenant: true, user: true },
      });
      if (!membership) throw new UnauthorizedError('User has no tenant membership');
      if (membership.tenant.status !== 'active') throw new ForbiddenError('Tenant is not active');
      if (!membership.active) throw new ForbiddenError('User account is deactivated');

      // Check password expiration
      if (isPasswordExpired(membership.user.passwordExpiresAt)) {
        throw new ForbiddenError('Password has expired. Please change your password.');
      }

      // Check password expiration
      if (isPasswordExpired(membership.user.passwordExpiresAt)) {
        throw new ForbiddenError('Password has expired. Please change your password.');
      }

      const token = jwt.sign(
        {
          userId: membership.userId,
          email: membership.user.email,
          role: membership.role,
          tenantId: membership.tenantId,
        },
        env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      const newRefreshToken = crypto.randomUUID();

      await fastify.prisma.$transaction([
        fastify.prisma.refreshToken.update({
          where: { id: stored.id },
          data: { revokedAt: new Date() },
        }),
        fastify.prisma.refreshToken.create({
          data: {
            userId: stored.userId,
            tenantId: stored.tenantId,
            token: newRefreshToken,
            expiresAt: refreshTokenExpiresAt(),
          },
        }),
      ]);

      return reply.status(200).send({
        token,
        refreshToken: newRefreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
      });
    }
  );

  fastify.post(
    '/v1/auth/logout',
    {
      schema: {
        body: { $ref: 'LogoutBody#' },
        response: { 204: { type: 'null' } },
      },
    },
    async (request, reply) => {
      const body = logoutBodySchema.parse(request.body);

      await fastify.prisma.refreshToken.updateMany({
        where: { token: body.refreshToken, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      return reply.status(204).send();
    }
  );

  fastify.post(
    '/v1/auth/register',
    {
      schema: {
        body: { $ref: 'RegisterBody#' },
        headers: { 'x-tenant-id': { type: 'string' } },
        response: { 201: { $ref: 'UserResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.tenants(user.role);

      const body = registerBodySchema.parse(request.body);
      const existing = await fastify.prisma.user.findUnique({ where: { email: body.email } });
      if (existing) throw new BadRequestError('Email already registered');

      const passwordHash = await bcrypt.hash(body.password, 12);
      const newUser = await fastify.prisma.user.create({
        data: { email: body.email, passwordHash, name: body.name ?? null },
      });

      await fastify.prisma.membership.create({
        data: { userId: newUser.id, tenantId, role: 'practitioner' },
      });

      // Set password changed date and expiry (90 days)
      const passwordExpiresAt = calculatePasswordExpiry(90);
      await fastify.prisma.user.update({
        where: { id: newUser.id },
        data: {
          passwordChangedAt: new Date(),
          passwordExpiresAt,
        },
      });

      // Save to password history
      await savePasswordHistory(fastify.prisma, newUser.id, passwordHash);

      return reply.status(201).send({
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
      });
    }
  );

  fastify.post(
    '/v1/auth/change-password',
    {
      schema: {
        body: { $ref: 'ChangePasswordBody#' },
        response: { 200: { type: 'object', properties: { success: { type: 'boolean' } } } },
      },
    },
    async (request, reply) => {
      const user = requireAuth(request);
      const body = changePasswordBodySchema.parse(request.body);

      const dbUser = await fastify.prisma.user.findUnique({ where: { id: user.userId } });
      if (!dbUser) throw new UnauthorizedError('User not found');

      // Verify current password
      const match = await bcrypt.compare(body.currentPassword, dbUser.passwordHash);
      if (!match) throw new UnauthorizedError('Current password is incorrect');

      // Check password history
      const canReuse = await checkPasswordHistory(fastify.prisma, user.userId, body.newPassword);
      if (!canReuse) {
        throw new BadRequestError(`Cannot reuse one of the last ${PASSWORD_HISTORY_LIMIT} passwords`);
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(body.newPassword, 12);

      // Update password and save to history
      const passwordExpiresAt = calculatePasswordExpiry(90);
      await fastify.prisma.user.update({
        where: { id: user.userId },
        data: {
          passwordHash: newPasswordHash,
          passwordChangedAt: new Date(),
          passwordExpiresAt,
        },
      });
      await savePasswordHistory(fastify.prisma, user.userId, newPasswordHash);

      // Revoke all refresh tokens (force re-login)
      await fastify.prisma.refreshToken.updateMany({
        where: { userId: user.userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      await auditLog(fastify.prisma, user.tenantId, 'change_password', 'user', user.userId, user.userId, {});

      return reply.status(200).send({ success: true });
    }
  );

  // 2FA Login endpoint
  fastify.post(
    '/v1/auth/login-2fa',
    {
      config: {
        rateLimit: { max: Number(process.env.RATE_LIMIT_AUTH) || 10, timeWindow: '1 minute' },
      },
      schema: {
        body: { $ref: 'LoginWithTwoFactorBody#' },
        response: { 200: { $ref: 'LoginResponse#' } },
      },
    },
    async (request, reply) => {
      const body = loginWithTwoFactorBodySchema.parse(request.body);
      const user = await fastify.prisma.user.findUnique({ where: { email: body.email } });
      if (!user) throw new UnauthorizedError('Invalid email or password');

      const match = await bcrypt.compare(body.password, user.passwordHash);
      if (!match) throw new UnauthorizedError('Invalid email or password');

      const membership = await fastify.prisma.membership.findFirst({
        where: { userId: user.id },
        include: { tenant: true },
      });
      if (!membership) throw new UnauthorizedError('User has no tenant membership');

      if (membership.tenant.status !== 'active') throw new ForbiddenError('Tenant is not active');
      if (!membership.active) throw new ForbiddenError('User account is deactivated');

      if (isPasswordExpired(user.passwordExpiresAt)) {
        throw new ForbiddenError('Password has expired. Please change your password.');
      }

      // Verify 2FA
      if (!user.twoFactorEnabled || !user.twoFactorSecret) {
        throw new BadRequestError('2FA is not enabled for this account');
      }

      let twoFactorValid = false;
      if (body.twoFactorCode) {
        twoFactorValid = verifyTotpToken(user.twoFactorSecret, body.twoFactorCode);
      } else if (body.backupCode) {
        twoFactorValid = await verifyBackupCode(fastify.prisma, user.id, body.backupCode);
      } else {
        throw new BadRequestError('Either twoFactorCode or backupCode is required');
      }

      if (!twoFactorValid) {
        throw new UnauthorizedError('Invalid 2FA code');
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: membership.role,
          tenantId: membership.tenantId,
        },
        env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      const refreshToken = crypto.randomUUID();
      await fastify.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tenantId: membership.tenantId,
          token: refreshToken,
          expiresAt: refreshTokenExpiresAt(),
        },
      });

      await auditLog(fastify.prisma, membership.tenantId, 'login', 'user', user.id, user.id, {
        email: user.email,
        twoFactorUsed: true,
      });

      return reply.status(200).send({
        token,
        refreshToken,
        expiresIn: ACCESS_TOKEN_EXPIRY_SECONDS,
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

  // Setup 2FA
  fastify.post(
    '/v1/auth/2fa/setup',
    {
      schema: {
        body: { $ref: 'SetupTwoFactorBody#' },
        response: {
          200: {
            type: 'object',
            properties: {
              secret: { type: 'string' },
              qrCodeUrl: { type: 'string' },
              backupCodes: { type: 'array', items: { type: 'string' } },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = requireAuth(request);
      requireOneOfRoles(request.user!.role, ['owner', 'admin']);

      const body = setupTwoFactorBodySchema.parse(request.body);
      const dbUser = await fastify.prisma.user.findUnique({
        where: { id: user.userId },
        include: { memberships: { include: { tenant: true } } },
      });
      if (!dbUser) throw new UnauthorizedError('User not found');

      const membership = dbUser.memberships.find((m) => m.tenantId === user.tenantId);
      if (!membership) throw new UnauthorizedError('User has no tenant membership');

      // Generate secret if not exists
      let secret: string = dbUser.twoFactorSecret || '';
      if (!secret) {
        const generated = generateTwoFactorSecret(dbUser.email, membership.tenant.name);
        secret = generated.base32!;
        if (!secret) {
          throw new BadRequestError('Failed to generate 2FA secret');
        }
        await fastify.prisma.user.update({
          where: { id: user.userId },
          data: { twoFactorSecret: secret },
        });
      }

      // Verify token before enabling
      const isValid = verifyTotpToken(secret, body.token);
      if (!isValid) {
        throw new BadRequestError('Invalid TOTP token');
      }

      // Generate backup codes
      const backupCodes = generateBackupCodes(8);
      const hashedBackupCodes = backupCodes.map(hashBackupCode);

      // Enable 2FA
      await fastify.prisma.user.update({
        where: { id: user.userId },
        data: {
          twoFactorEnabled: true,
          twoFactorBackupCodes: hashedBackupCodes,
        },
      });

      // Generate QR code
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(membership.tenant.name)}:${encodeURIComponent(dbUser.email)}?secret=${secret}&issuer=${encodeURIComponent('Anamnese Inteligente')}`;
      const qrCodeUrl = await generateQRCodeUrl(otpauthUrl);

      await auditLog(fastify.prisma, user.tenantId, 'enable_2fa', 'user', user.userId, user.userId, {});

      return reply.status(200).send({
        secret,
        qrCodeUrl,
        backupCodes, // Only returned once during setup
      });
    }
  );

  // Get 2FA setup QR code (if not enabled yet)
  fastify.get(
    '/v1/auth/2fa/setup',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              secret: { type: 'string' },
              qrCodeUrl: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const user = requireAuth(request);
      requireOneOfRoles(request.user!.role, ['owner', 'admin']);

      const dbUser = await fastify.prisma.user.findUnique({
        where: { id: user.userId },
        include: { memberships: { include: { tenant: true } } },
      });
      if (!dbUser) throw new UnauthorizedError('User not found');

      if (dbUser.twoFactorEnabled) {
        throw new BadRequestError('2FA is already enabled');
      }

      const membership = dbUser.memberships.find((m) => m.tenantId === user.tenantId);
      if (!membership) throw new UnauthorizedError('User has no tenant membership');

      // Generate secret if not exists
      let secret: string = dbUser.twoFactorSecret || '';
      if (!secret) {
        const generated = generateTwoFactorSecret(dbUser.email, membership.tenant.name);
        secret = generated.base32!;
        if (!secret) {
          throw new BadRequestError('Failed to generate 2FA secret');
        }
        await fastify.prisma.user.update({
          where: { id: user.userId },
          data: { twoFactorSecret: secret },
        });
      }

      // Generate QR code
      const otpauthUrl = `otpauth://totp/${encodeURIComponent(membership.tenant.name)}:${encodeURIComponent(dbUser.email)}?secret=${secret}&issuer=${encodeURIComponent('Anamnese Inteligente')}`;
      const qrCodeUrl = await generateQRCodeUrl(otpauthUrl);

      return reply.status(200).send({
        secret,
        qrCodeUrl,
      });
    }
  );

  // Disable 2FA
  fastify.post(
    '/v1/auth/2fa/disable',
    {
      schema: {
        body: { $ref: 'DisableTwoFactorBody#' },
        response: { 200: { type: 'object', properties: { success: { type: 'boolean' } } } },
      },
    },
    async (request, reply) => {
      const user = requireAuth(request);
      requireOneOfRoles(request.user!.role, ['owner', 'admin']);

      const body = disableTwoFactorBodySchema.parse(request.body);
      const dbUser = await fastify.prisma.user.findUnique({ where: { id: user.userId } });
      if (!dbUser) throw new UnauthorizedError('User not found');

      // Verify password
      const match = await bcrypt.compare(body.password, dbUser.passwordHash);
      if (!match) throw new UnauthorizedError('Password is incorrect');

      if (!dbUser.twoFactorEnabled) {
        throw new BadRequestError('2FA is not enabled');
      }

      // Disable 2FA
      await fastify.prisma.user.update({
        where: { id: user.userId },
        data: {
          twoFactorEnabled: false,
          twoFactorSecret: null,
          twoFactorBackupCodes: [],
        },
      });

      await auditLog(fastify.prisma, user.tenantId, 'disable_2fa', 'user', user.userId, user.userId, {});

      return reply.status(200).send({ success: true });
    }
  );
}
