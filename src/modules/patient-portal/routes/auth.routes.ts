import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { requireTenant } from '@http/middleware/tenant.js';
import { NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError } from '@shared/errors/index.js';
import { patientLoginSchema, patientRegisterSchema } from '../schemas.js';
import { env } from '@config/env.js';
import { auditLog } from '@shared/utils/audit.js';
import type { PrismaClient } from '@prisma/client';
import {
  calculatePasswordExpiry,
  savePasswordHistory,
  isPasswordExpired,
} from '../../auth/password-policy.js';
import { ACCESS_TOKEN_EXPIRY, refreshTokenExpiresAt } from '../route-common.js';

export async function registerPatientPortalAuthRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/v1/patient-portal/login',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              refreshToken: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  tenantId: { type: 'string' },
                  patientId: { type: 'string', nullable: true },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = patientLoginSchema.parse(request.body);

      const user = await fastify.prisma.user.findUnique({
        where: { email: body.email },
        include: { patients: true },
      });

      if (!user) throw new UnauthorizedError('Email ou senha inválidos');

      const lockedUntil = user.lockedUntil ?? null;
      if (lockedUntil && lockedUntil > new Date()) {
        throw new ForbiddenError(
          'Conta temporariamente bloqueada. Tente novamente mais tarde.'
        );
      }

      const match = await bcrypt.compare(body.password, user.passwordHash);
      if (!match) {
        const attempts = (user.loginAttempts ?? 0) + 1;
        const newLockedUntil =
          attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;
        await fastify.prisma.user.update({
          where: { id: user.id },
          data: { loginAttempts: attempts, lockedUntil: newLockedUntil },
        });
        throw new UnauthorizedError('Email ou senha inválidos');
      }

      await fastify.prisma.user.update({
        where: { id: user.id },
        data: { loginAttempts: 0, lockedUntil: null },
      });

      const tenantId = requireTenant(request);
      const patient = user.patients.find((p) => p.tenantId === tenantId && !p.deletedAt);

      if (!patient) {
        throw new UnauthorizedError('Esta conta não é de paciente neste tenant');
      }

      if (isPasswordExpired(user.passwordExpiresAt)) {
        throw new UnauthorizedError('Senha expirada. Por favor, redefina sua senha.');
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: 'patient',
          tenantId,
          patientId: patient.id,
        },
        env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      const refreshToken = crypto.randomUUID();
      await fastify.prisma.refreshToken.create({
        data: {
          userId: user.id,
          tenantId,
          token: refreshToken,
          expiresAt: refreshTokenExpiresAt(),
        },
      });

      await auditLog(fastify.prisma, tenantId, 'login', 'patient', patient.id, user.id, {
        email: user.email,
      });

      return reply.status(200).send({
        token,
        refreshToken,
        user: {
          userId: user.id,
          email: user.email,
          role: 'patient',
          tenantId,
          patientId: patient.id,
        },
      });
    }
  );

  fastify.post(
    '/v1/patient-portal/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password', 'fullName'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
            fullName: { type: 'string' },
            tenantId: { type: 'string', nullable: true },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              token: { type: 'string' },
              refreshToken: { type: 'string' },
              user: {
                type: 'object',
                properties: {
                  userId: { type: 'string' },
                  email: { type: 'string' },
                  role: { type: 'string' },
                  tenantId: { type: 'string' },
                  patientId: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = patientRegisterSchema.parse(request.body);
      const tenantId = body.tenantId ?? requireTenant(request);

      const tenant = await fastify.prisma.tenant.findFirst({
        where: { id: tenantId, deletedAt: null },
      });
      if (!tenant) throw new NotFoundError('Tenant não encontrado');
      if (tenant.status !== 'active') throw new BadRequestError('Tenant não está ativo');

      const existingUser = await fastify.prisma.user.findUnique({
        where: { email: body.email },
      });

      const existingPatient = await fastify.prisma.patient.findFirst({
        where: { tenantId, email: body.email, deletedAt: null },
      });

      if (existingPatient?.userId) {
        throw new BadRequestError('Este paciente já possui conta ativa. Faça login.');
      }
      if (existingUser) {
        throw new BadRequestError('Email já cadastrado');
      }

      const passwordHash = await bcrypt.hash(body.password, 12);
      const passwordExpiresAt = calculatePasswordExpiry(90);

      const result = await fastify.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: body.email,
            passwordHash,
            name: body.fullName,
            passwordChangedAt: new Date(),
            passwordExpiresAt,
          },
        });

        await savePasswordHistory(tx as unknown as PrismaClient, newUser.id, passwordHash);

        const linkedPatient = existingPatient
          ? await tx.patient.update({
              where: { id: existingPatient.id },
              data: {
                userId: newUser.id,
                fullName: body.fullName || existingPatient.fullName,
                email: body.email,
              },
            })
          : await tx.patient.create({
              data: {
                tenantId,
                fullName: body.fullName,
                email: body.email,
                userId: newUser.id,
              },
            });

        return { user: newUser, patient: linkedPatient };
      });

      await auditLog(
        fastify.prisma,
        tenantId,
        'create',
        'patient',
        result.patient.id,
        result.user.id,
        {
          email: body.email,
          fullName: body.fullName,
        }
      );

      const token = jwt.sign(
        {
          userId: result.user.id,
          email: result.user.email,
          role: 'patient',
          tenantId,
          patientId: result.patient.id,
        },
        env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
      );

      const refreshToken = crypto.randomUUID();
      await fastify.prisma.refreshToken.create({
        data: {
          userId: result.user.id,
          tenantId,
          token: refreshToken,
          expiresAt: refreshTokenExpiresAt(),
        },
      });

      return reply.status(201).send({
        token,
        refreshToken,
        user: {
          userId: result.user.id,
          email: result.user.email,
          role: 'patient',
          tenantId,
          patientId: result.patient.id,
        },
      });
    }
  );
}
