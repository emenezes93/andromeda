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
      const patientId = user.patientId;
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
      const patientId = user.patientId;
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
      const patientId = user.patientId;
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
      const patientId = user.patientId;
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

  // GET /v1/patient-portal/my-training-plans — Planos de treino do paciente
  fastify.get(
    '/v1/patient-portal/my-training-plans',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            active: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const { page = 1, limit = 20, active } = request.query as {
        page?: number;
        limit?: number;
        active?: boolean;
      };
      const skip = (page - 1) * limit;

      const where: {
        tenantId: string;
        patientId: string;
        deletedAt: null;
        active?: boolean;
      } = {
        tenantId,
        patientId,
        deletedAt: null,
      };
      if (typeof active === 'boolean') where.active = active;

      const [items, total] = await Promise.all([
        fastify.prisma.trainingPlan.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ active: 'desc' }, { startDate: 'desc' }],
          include: {
            _count: { select: { executions: true } },
          },
        }),
        fastify.prisma.trainingPlan.count({ where }),
      ]);

      return reply.status(200).send({
        data: items.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          startDate: p.startDate.toISOString(),
          endDate: p.endDate?.toISOString() ?? null,
          active: p.active,
          executionsCount: p._count.executions,
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

  // GET /v1/patient-portal/my-training-plans/:id — Detalhe do plano de treino
  fastify.get(
    '/v1/patient-portal/my-training-plans/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const { id } = request.params as { id: string };

      const plan = await fastify.prisma.trainingPlan.findFirst({
        where: { id, tenantId, patientId, deletedAt: null },
        include: { _count: { select: { executions: true } } },
      });
      if (!plan) throw new NotFoundError('Plano de treino não encontrado');

      return reply.status(200).send({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        planJson: plan.planJson,
        startDate: plan.startDate.toISOString(),
        endDate: plan.endDate?.toISOString() ?? null,
        active: plan.active,
        executionsCount: plan._count.executions,
      });
    }
  );

  // POST /v1/patient-portal/my-training-executions — Registrar treino realizado
  fastify.post(
    '/v1/patient-portal/my-training-executions',
    {
      schema: {
        body: {
          type: 'object',
          required: ['executedAt'],
          properties: {
            trainingPlanId: { type: 'string', nullable: true },
            executedAt: { type: 'string' },
            durationMinutes: { type: 'number', nullable: true },
            notes: { type: 'string', nullable: true },
            completed: { type: 'boolean' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              executedAt: { type: 'string' },
              durationMinutes: { type: 'number', nullable: true },
              completed: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const body = request.body as {
        trainingPlanId?: string | null;
        executedAt: string;
        durationMinutes?: number | null;
        notes?: string | null;
        completed?: boolean;
      };

      if (body.trainingPlanId) {
        const plan = await fastify.prisma.trainingPlan.findFirst({
          where: {
            id: body.trainingPlanId,
            tenantId,
            patientId,
            deletedAt: null,
          },
        });
        if (!plan) throw new NotFoundError('Plano de treino não encontrado');
      }

      const executedAt = new Date(body.executedAt);
      if (isNaN(executedAt.getTime())) throw new BadRequestError('Data de execução inválida');

      const execution = await fastify.prisma.trainingExecution.create({
        data: {
          tenantId,
          patientId,
          trainingPlanId: body.trainingPlanId ?? null,
          executedAt,
          durationMinutes: body.durationMinutes ?? null,
          notes: body.notes ?? null,
          completed: body.completed ?? true,
        },
      });

      await auditLog(
        fastify.prisma,
        tenantId,
        'create',
        'training_execution',
        execution.id,
        user.userId,
        { patientId, executedAt: body.executedAt }
      );

      return reply.status(201).send({
        id: execution.id,
        executedAt: execution.executedAt.toISOString(),
        durationMinutes: execution.durationMinutes,
        completed: execution.completed,
      });
    }
  );

  // GET /v1/patient-portal/my-diet-plans — Planos de dieta do paciente
  fastify.get(
    '/v1/patient-portal/my-diet-plans',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            active: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const { page = 1, limit = 20, active } = request.query as {
        page?: number;
        limit?: number;
        active?: boolean;
      };
      const skip = (page - 1) * limit;

      const where: {
        tenantId: string;
        patientId: string;
        deletedAt: null;
        active?: boolean;
      } = {
        tenantId,
        patientId,
        deletedAt: null,
      };
      if (typeof active === 'boolean') where.active = active;

      const [items, total] = await Promise.all([
        fastify.prisma.dietPlan.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ active: 'desc' }, { startDate: 'desc' }],
        }),
        fastify.prisma.dietPlan.count({ where }),
      ]);

      return reply.status(200).send({
        data: items.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          caloriesKcal: p.caloriesKcal,
          proteinG: p.proteinG,
          carbsG: p.carbsG,
          fatG: p.fatG,
          waterMl: p.waterMl,
          restrictions: p.restrictions,
          startDate: p.startDate.toISOString(),
          endDate: p.endDate?.toISOString() ?? null,
          active: p.active,
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

  // GET /v1/patient-portal/my-diet-plans/:id — Detalhe do plano de dieta
  fastify.get(
    '/v1/patient-portal/my-diet-plans/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const { id } = request.params as { id: string };

      const plan = await fastify.prisma.dietPlan.findFirst({
        where: { id, tenantId, patientId, deletedAt: null },
      });
      if (!plan) throw new NotFoundError('Plano de dieta não encontrado');

      return reply.status(200).send({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        caloriesKcal: plan.caloriesKcal,
        proteinG: plan.proteinG,
        carbsG: plan.carbsG,
        fatG: plan.fatG,
        waterMl: plan.waterMl,
        restrictions: plan.restrictions,
        mealPlanJson: plan.mealPlanJson,
        startDate: plan.startDate.toISOString(),
        endDate: plan.endDate?.toISOString() ?? null,
        active: plan.active,
      });
    }
  );
}
