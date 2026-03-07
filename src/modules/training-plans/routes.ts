import type { FastifyInstance } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError, BadRequestError } from '@shared/errors/index.js';
import {
  createTrainingPlanSchema,
  updateTrainingPlanSchema,
  listTrainingPlansQuerySchema,
  duplicateTrainingPlanSchema,
} from './schemas.js';
import { calculateTrainingAdherence } from './adherence.js';
import { auditLog } from '@shared/utils/audit.js';
import { skipFor } from '@shared/utils/pagination.js';
import { createPatientNotification } from '../patient-notifications/service.js';

export async function trainingPlansRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/v1/training-plans',
    {
      schema: {
        body: {
          type: 'object',
          required: ['patientId', 'name', 'planJson', 'startDate'],
          properties: {
            patientId: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            planJson: { type: 'object' },
            startDate: { type: 'string' },
            endDate: { type: 'string', nullable: true },
            active: { type: 'boolean' },
          },
        },
        response: {
          201: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const body = createTrainingPlanSchema.parse(request.body);

      const patient = await fastify.prisma.patient.findFirst({
        where: { id: body.patientId, tenantId, deletedAt: null },
      });
      if (!patient) throw new NotFoundError('Paciente não encontrado');

      const startDate = new Date(body.startDate);
      if (isNaN(startDate.getTime())) throw new BadRequestError('Data de início inválida');
      const endDate = body.endDate ? new Date(body.endDate) : null;
      if (endDate && isNaN(endDate.getTime())) throw new BadRequestError('Data de término inválida');
      if (endDate && endDate <= startDate) {
        throw new BadRequestError('Data de término deve ser posterior à data de início');
      }

      const plan = await fastify.prisma.trainingPlan.create({
        data: {
          tenantId,
          patientId: body.patientId,
          name: body.name,
          description: body.description ?? null,
          planJson: body.planJson as object,
          startDate,
          endDate,
          active: body.active ?? true,
        },
        include: {
          patient: { select: { id: true, fullName: true } },
          _count: { select: { executions: true } },
        },
      });

      await auditLog(fastify.prisma, tenantId, 'create', 'training_plan', plan.id, user.userId, {
        patientId: body.patientId,
        name: body.name,
      });

      await createPatientNotification(fastify.prisma, {
        tenantId,
        patientId: body.patientId,
        type: 'training_plan_assigned',
        metadata: {
          planType: 'training',
          planId: plan.id,
          assignedByProfessionalId: user.userId,
          assignedAt: plan.startDate.toISOString(),
          title: plan.name,
        },
      });

      return reply.status(201).send({
        id: plan.id,
        patientId: plan.patientId,
        patientName: plan.patient.fullName,
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

  fastify.get(
    '/v1/training-plans',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            patientId: { type: 'string' },
            active: { type: 'boolean' },
            name: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.readOnly(user.role);

      const query = listTrainingPlansQuerySchema.parse(request.query);
      const { page = 1, limit = 20 } = query;
      const skip = skipFor(page, limit);

      const where = {
        tenantId,
        deletedAt: null as null,
        ...(query.patientId && { patientId: query.patientId }),
        ...(query.active !== undefined && { active: query.active }),
        ...(query.name && { name: { contains: query.name, mode: 'insensitive' as const } }),
      };

      const [items, total] = await Promise.all([
        fastify.prisma.trainingPlan.findMany({
          where,
          skip,
          take: limit,
          orderBy: [{ startDate: 'desc' }, { id: 'asc' }],
          include: {
            patient: { select: { id: true, fullName: true } },
            _count: { select: { executions: true } },
          },
        }),
        fastify.prisma.trainingPlan.count({ where }),
      ]);

      return reply.status(200).send({
        data: items.map((p) => ({
          id: p.id,
          patientId: p.patientId,
          patientName: p.patient.fullName,
          name: p.name,
          description: p.description,
          planJson: p.planJson,
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
    '/v1/training-plans/:id',
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
      Guards.readOnly(user.role);

      const { id } = request.params as { id: string };

      const plan = await fastify.prisma.trainingPlan.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: {
          patient: { select: { id: true, fullName: true } },
          _count: { select: { executions: true } },
        },
      });
      if (!plan) throw new NotFoundError('Plano de treino não encontrado');

      const now = new Date();
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const adherence7d = await calculateTrainingAdherence(
        fastify.prisma,
        id,
        tenantId,
        sevenDaysAgo,
        now
      );

      return reply.status(200).send({
        id: plan.id,
        patientId: plan.patientId,
        patientName: plan.patient.fullName,
        name: plan.name,
        description: plan.description,
        planJson: plan.planJson,
        startDate: plan.startDate.toISOString(),
        endDate: plan.endDate?.toISOString() ?? null,
        active: plan.active,
        executionsCount: plan._count.executions,
        adherencePercent: adherence7d.adherencePercent,
      });
    }
  );

  fastify.post(
    '/v1/training-plans/:id/duplicate',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          required: ['patientId'],
          properties: {
            patientId: { type: 'string' },
            name: { type: 'string' },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              patientId: { type: 'string' },
              patientName: { type: 'string' },
              name: { type: 'string' },
              startDate: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { id } = request.params as { id: string };
      const body = duplicateTrainingPlanSchema.parse(request.body);

      const existing = await fastify.prisma.trainingPlan.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Plano de treino não encontrado');

      const patient = await fastify.prisma.patient.findFirst({
        where: { id: body.patientId, tenantId, deletedAt: null },
      });
      if (!patient) throw new NotFoundError('Paciente não encontrado');

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const name = (body.name && body.name.trim()) || `${existing.name} (cópia)`;

      const plan = await fastify.prisma.trainingPlan.create({
        data: {
          tenantId,
          patientId: body.patientId,
          name: name.trim(),
          description: existing.description,
          planJson: existing.planJson as object,
          startDate: today,
          endDate: null,
          active: true,
        },
        include: {
          patient: { select: { id: true, fullName: true } },
        },
      });

      await auditLog(fastify.prisma, tenantId, 'create', 'training_plan', plan.id, user.userId, {
        patientId: body.patientId,
        name: plan.name,
        duplicatedFrom: id,
      });

      await createPatientNotification(fastify.prisma, {
        tenantId,
        patientId: body.patientId,
        type: 'training_plan_assigned',
        metadata: {
          planType: 'training',
          planId: plan.id,
          assignedByProfessionalId: user.userId,
          assignedAt: plan.startDate.toISOString(),
          title: plan.name,
        },
      });

      return reply.status(201).send({
        id: plan.id,
        patientId: plan.patientId,
        patientName: plan.patient.fullName,
        name: plan.name,
        startDate: plan.startDate.toISOString(),
      });
    }
  );

  fastify.patch(
    '/v1/training-plans/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: { id: { type: 'string' } },
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            planJson: { type: 'object' },
            endDate: { type: 'string', nullable: true },
            active: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { id } = request.params as { id: string };
      const body = updateTrainingPlanSchema.parse(request.body);

      const existing = await fastify.prisma.trainingPlan.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Plano de treino não encontrado');

      const updateData: {
        name?: string;
        description?: string | null;
        planJson?: object;
        endDate?: Date | null;
        active?: boolean;
      } = {};
      if (body.name !== undefined) updateData.name = body.name;
      if (body.description !== undefined) updateData.description = body.description ?? null;
      if (body.planJson !== undefined) updateData.planJson = body.planJson as object;
      if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
      if (body.active !== undefined) updateData.active = body.active;

      const plan = await fastify.prisma.trainingPlan.update({
        where: { id },
        data: updateData,
      });

      await auditLog(fastify.prisma, tenantId, 'update', 'training_plan', id, user.userId, {
        changes: Object.keys(updateData),
      });

      if (Object.keys(updateData).length > 0) {
        await createPatientNotification(fastify.prisma, {
          tenantId,
          patientId: existing.patientId,
          type: 'training_plan_assigned',
          metadata: {
            planType: 'training',
            planId: plan.id,
            assignedByProfessionalId: user.userId,
            assignedAt: new Date().toISOString(),
            title: plan.name,
            updated: true,
          },
        });
      }

      return reply.status(200).send({
        id: plan.id,
        name: plan.name,
        active: plan.active,
        endDate: plan.endDate?.toISOString() ?? null,
        planJson: plan.planJson,
      });
    }
  );

  fastify.delete(
    '/v1/training-plans/:id',
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
      Guards.sessions(user.role);

      const { id } = request.params as { id: string };

      const existing = await fastify.prisma.trainingPlan.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Plano de treino não encontrado');

      await fastify.prisma.trainingPlan.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await auditLog(fastify.prisma, tenantId, 'delete', 'training_plan', id, user.userId);
      return reply.status(204).send();
    }
  );
}
