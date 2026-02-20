import type { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { NotFoundError, BadRequestError, UnauthorizedError, ForbiddenError } from '@shared/errors/index.js';
import { patientLoginSchema, patientRegisterSchema } from './schemas.js';
import { env } from '@config/env.js';
import { auditLog } from '@shared/utils/audit.js';
import type { PrismaClient } from '@prisma/client';
import {
  calculatePasswordExpiry,
  savePasswordHistory,
  isPasswordExpired,
} from '../auth/password-policy.js';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_DAYS = 30;

function refreshTokenExpiresAt(): Date {
  const date = new Date();
  date.setDate(date.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return date;
}

export async function patientPortalRoutes(fastify: FastifyInstance): Promise<void> {
  // POST /v1/patient-portal/login — Login do paciente
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

      // Verificar se é paciente (tem Patient vinculado)
      // Para login, assumimos que o paciente está no tenant do header x-tenant-id
      const tenantId = requireTenant(request);
      const patient = user.patients.find((p) => p.tenantId === tenantId && !p.deletedAt);

      if (!patient) {
        throw new UnauthorizedError('Esta conta não é de paciente neste tenant');
      }

      // Verificar se senha expirou
      if (isPasswordExpired(user.passwordExpiresAt)) {
        throw new UnauthorizedError('Senha expirada. Por favor, redefina sua senha.');
      }

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: 'patient', // Role especial para pacientes
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

  // POST /v1/patient-portal/register — Registro de paciente (cria User + Patient)
  fastify.post(
    '/v1/patient-portal/register',
    {
      schema: {
        body: {
          type: 'object',
          required: ['email', 'password', 'fullName', 'tenantId'],
          properties: {
            email: { type: 'string' },
            password: { type: 'string' },
            fullName: { type: 'string' },
            tenantId: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              email: { type: 'string' },
              fullName: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = patientRegisterSchema.parse(request.body);
      const tenantId = body.tenantId;

      // Verificar se tenant existe e está ativo
      const tenant = await fastify.prisma.tenant.findFirst({
        where: { id: tenantId, deletedAt: null },
      });
      if (!tenant) throw new NotFoundError('Tenant não encontrado');
      if (tenant.status !== 'active') throw new BadRequestError('Tenant não está ativo');

      // Verificar se email já existe
      const existingUser = await fastify.prisma.user.findUnique({
        where: { email: body.email },
      });
      if (existingUser) throw new BadRequestError('Email já cadastrado');

      // Verificar se já existe paciente com este email no tenant
      const existingPatient = await fastify.prisma.patient.findFirst({
        where: { tenantId, email: body.email, deletedAt: null },
      });
      if (existingPatient) throw new BadRequestError('Já existe paciente com este email');

      const passwordHash = await bcrypt.hash(body.password, 12);
      const passwordExpiresAt = calculatePasswordExpiry(90);

      // Criar User e Patient em transação
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

        const newPatient = await tx.patient.create({
          data: {
            tenantId,
            fullName: body.fullName,
            email: body.email,
            userId: newUser.id,
          },
        });

        return { user: newUser, patient: newPatient };
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

      return reply.status(201).send({
        id: result.patient.id,
        email: result.user.email,
        fullName: result.patient.fullName,
      });
    }
  );

  // GET /v1/patient-portal/me — Dados do paciente logado
  fastify.get(
    '/v1/patient-portal/me',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              patient: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  fullName: { type: 'string' },
                  email: { type: 'string', nullable: true },
                  phone: { type: 'string', nullable: true },
                  birthDate: { type: 'string', nullable: true },
                },
              },
              sessionsCount: { type: 'number' },
              evolutionsCount: { type: 'number' },
              goalsCount: { type: 'number' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);

      // Verificar se é paciente (role 'patient' ou tem patientId no token)
      const patientId = (user as { patientId?: string }).patientId;
      if (!patientId) {
        throw new UnauthorizedError('Acesso restrito a pacientes');
      }

      const patient = await fastify.prisma.patient.findFirst({
        where: { id: patientId, tenantId, deletedAt: null },
        include: {
          _count: {
            select: { sessions: true, evolutions: true, goals: true },
          },
        },
      });

      if (!patient) throw new NotFoundError('Paciente não encontrado');

      return reply.status(200).send({
        patient: {
          id: patient.id,
          fullName: patient.fullName,
          email: patient.email,
          phone: patient.phone,
          birthDate: patient.birthDate?.toISOString() ?? null,
        },
        sessionsCount: patient._count.sessions,
        evolutionsCount: patient._count.evolutions,
        goalsCount: patient._count.goals,
      });
    }
  );

  // GET /v1/patient-portal/my-sessions — Sessões do paciente
  fastify.get(
    '/v1/patient-portal/my-sessions',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            status: { type: 'string', enum: ['in_progress', 'completed'] },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = (user as { patientId?: string }).patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const { page = 1, limit = 20, status } = request.query as {
        page?: number;
        limit?: number;
        status?: 'in_progress' | 'completed';
      };

      const skip = (page - 1) * limit;
      const where: {
        tenantId: string;
        patientId: string;
        deletedAt: null;
        status?: 'in_progress' | 'completed';
      } = {
        tenantId,
        patientId,
        deletedAt: null,
      };
      if (status) where.status = status;

      const [items, total] = await Promise.all([
        fastify.prisma.anamnesisSession.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            template: { select: { id: true, name: true } },
            aiInsights: { take: 1, orderBy: { createdAt: 'desc' } },
          },
        }),
        fastify.prisma.anamnesisSession.count({ where }),
      ]);

      return reply.status(200).send({
        data: items.map((s) => ({
          id: s.id,
          templateName: s.template.name,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
          hasInsights: s.aiInsights.length > 0,
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasMore: page * limit < total,
        },
      });
    }
  );

  // GET /v1/patient-portal/my-evolutions — Evoluções do paciente
  fastify.get(
    '/v1/patient-portal/my-evolutions',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = (user as { patientId?: string }).patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
      const skip = (page - 1) * limit;

      const [items, total] = await Promise.all([
        fastify.prisma.patientEvolution.findMany({
          where: { tenantId, patientId },
          skip,
          take: limit,
          orderBy: { recordedAt: 'desc' },
        }),
        fastify.prisma.patientEvolution.count({ where: { tenantId, patientId } }),
      ]);

      return reply.status(200).send({
        data: items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasMore: page * limit < total,
        },
      });
    }
  );

  // GET /v1/patient-portal/my-goals — Metas do paciente
  fastify.get(
    '/v1/patient-portal/my-goals',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            achieved: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = (user as { patientId?: string }).patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const { page = 1, limit = 20, achieved } = request.query as {
        page?: number;
        limit?: number;
        achieved?: boolean;
      };
      const skip = (page - 1) * limit;

      const where: {
        tenantId: string;
        patientId: string;
        deletedAt: null;
        achievedAt?: null | { not: null };
      } = {
        tenantId,
        patientId,
        deletedAt: null,
      };
      if (achieved === true) {
        where.achievedAt = { not: null };
      } else if (achieved === false) {
        where.achievedAt = null;
      }

      const [items, total] = await Promise.all([
        fastify.prisma.patientGoal.findMany({
          where,
          skip,
          take: limit,
          orderBy: { targetDate: 'asc' },
        }),
        fastify.prisma.patientGoal.count({ where }),
      ]);

      return reply.status(200).send({
        data: items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          hasMore: page * limit < total,
        },
      });
    }
  );
}
