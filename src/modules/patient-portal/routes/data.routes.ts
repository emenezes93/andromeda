import type { FastifyInstance } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { NotFoundError, UnauthorizedError, BadRequestError } from '@shared/errors/index.js';
import { auditLog } from '@shared/utils/audit.js';

export async function registerPatientPortalDataRoutes(fastify: FastifyInstance): Promise<void> {
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
              hasUnreadNotifications: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);

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

      const hasUnreadNotifications =
        (await fastify.prisma.patientNotification.findFirst({
          where: { tenantId, patientId, readAt: null },
          select: { id: true },
        })) !== null;

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
        hasUnreadNotifications,
      });
    }
  );

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
