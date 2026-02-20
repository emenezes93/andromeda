import type { FastifyInstance } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError } from '@shared/errors/index.js';
import {
  createTrainingExecutionSchema,
  listTrainingExecutionsQuerySchema,
} from './schemas.js';
import { auditLog } from '@shared/utils/audit.js';
import { skipFor } from '@shared/utils/pagination.js';

export async function trainingExecutionsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/v1/training-executions',
    {
      schema: {
        body: {
          type: 'object',
          required: ['patientId', 'executedAt'],
          properties: {
            patientId: { type: 'string' },
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
              patientId: { type: 'string' },
              executedAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const body = createTrainingExecutionSchema.parse(request.body);

      const patient = await fastify.prisma.patient.findFirst({
        where: { id: body.patientId, tenantId, deletedAt: null },
      });
      if (!patient) throw new NotFoundError('Paciente não encontrado');

      if (body.trainingPlanId) {
        const plan = await fastify.prisma.trainingPlan.findFirst({
          where: { id: body.trainingPlanId, tenantId, patientId: body.patientId, deletedAt: null },
        });
        if (!plan) throw new NotFoundError('Plano de treino não encontrado');
      }

      const execution = await fastify.prisma.trainingExecution.create({
        data: {
          tenantId,
          patientId: body.patientId,
          trainingPlanId: body.trainingPlanId ?? null,
          executedAt: new Date(body.executedAt),
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
        { patientId: body.patientId, executedAt: body.executedAt }
      );

      return reply.status(201).send({
        id: execution.id,
        patientId: execution.patientId,
        executedAt: execution.executedAt.toISOString(),
      });
    }
  );

  fastify.get(
    '/v1/training-executions',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            patientId: { type: 'string' },
            trainingPlanId: { type: 'string' },
            from: { type: 'string' },
            to: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.readOnly(user.role);

      const query = listTrainingExecutionsQuerySchema.parse(request.query);
      const { page = 1, limit = 20 } = query;
      const skip = skipFor(page, limit);

      const where: {
        tenantId: string;
        patientId?: string;
        trainingPlanId?: string;
        executedAt?: { gte?: Date; lte?: Date };
      } = { tenantId };
      if (query.patientId) where.patientId = query.patientId;
      if (query.trainingPlanId) where.trainingPlanId = query.trainingPlanId;
      if (query.from || query.to) {
        where.executedAt = {};
        if (query.from) where.executedAt.gte = new Date(query.from);
        if (query.to) where.executedAt.lte = new Date(query.to);
      }

      const [items, total] = await Promise.all([
        fastify.prisma.trainingExecution.findMany({
          where,
          skip,
          take: limit,
          orderBy: { executedAt: 'desc' },
          include: {
            patient: { select: { id: true, fullName: true } },
            plan: { select: { id: true, name: true } },
          },
        }),
        fastify.prisma.trainingExecution.count({ where }),
      ]);

      return reply.status(200).send({
        data: items.map((e) => ({
          id: e.id,
          patientId: e.patientId,
          patientName: e.patient.fullName,
          trainingPlanId: e.trainingPlanId,
          planName: e.plan?.name ?? null,
          executedAt: e.executedAt.toISOString(),
          durationMinutes: e.durationMinutes,
          notes: e.notes,
          completed: e.completed,
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
    '/v1/training-executions/:id',
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

      const execution = await fastify.prisma.trainingExecution.findFirst({
        where: { id, tenantId },
        include: {
          patient: { select: { id: true, fullName: true } },
          plan: { select: { id: true, name: true } },
        },
      });
      if (!execution) throw new NotFoundError('Execução de treino não encontrada');

      return reply.status(200).send({
        id: execution.id,
        patientId: execution.patientId,
        patientName: execution.patient.fullName,
        trainingPlanId: execution.trainingPlanId,
        planName: execution.plan?.name ?? null,
        executedAt: execution.executedAt.toISOString(),
        durationMinutes: execution.durationMinutes,
        notes: execution.notes,
        completed: execution.completed,
      });
    }
  );

  fastify.delete(
    '/v1/training-executions/:id',
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

      const existing = await fastify.prisma.trainingExecution.findFirst({
        where: { id, tenantId },
      });
      if (!existing) throw new NotFoundError('Execução de treino não encontrada');

      await fastify.prisma.trainingExecution.delete({ where: { id } });
      await auditLog(fastify.prisma, tenantId, 'delete', 'training_execution', id, user.userId);
      return reply.status(204).send();
    }
  );
}
