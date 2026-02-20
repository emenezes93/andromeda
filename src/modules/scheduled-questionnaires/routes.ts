import type { FastifyInstance } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError, BadRequestError } from '@shared/errors/index.js';
import {
  createScheduledQuestionnaireSchema,
  updateScheduledQuestionnaireSchema,
  listScheduledQuestionnairesQuerySchema,
} from './schemas.js';
import { auditLog } from '@shared/utils/audit.js';
import { calculateNextRun, type Frequency } from './scheduler.js';
import { skipFor } from '@shared/utils/pagination.js';

export async function scheduledQuestionnairesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/v1/scheduled-questionnaires',
    {
      schema: {
        body: {
          type: 'object',
          required: ['templateId', 'frequency', 'startDate'],
          properties: {
            templateId: { type: 'string' },
            patientId: { type: 'string', nullable: true },
            frequency: {
              type: 'string',
              enum: ['weekly', 'biweekly', 'monthly', 'quarterly'],
            },
            dayOfWeek: { type: 'number', nullable: true },
            dayOfMonth: { type: 'number', nullable: true },
            startDate: { type: 'string' },
            endDate: { type: 'string', nullable: true },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              templateId: { type: 'string' },
              frequency: { type: 'string' },
              nextRunAt: { type: 'string', nullable: true },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.templates(user.role);

      const body = createScheduledQuestionnaireSchema.parse(request.body);

      const template = await fastify.prisma.anamnesisTemplate.findFirst({
        where: { id: body.templateId, tenantId, deletedAt: null },
      });
      if (!template) throw new NotFoundError('Template não encontrado');

      if (body.patientId) {
        const patient = await fastify.prisma.patient.findFirst({
          where: { id: body.patientId, tenantId, deletedAt: null },
        });
        if (!patient) throw new NotFoundError('Paciente não encontrado');
      }

      if (
        (body.frequency === 'weekly' || body.frequency === 'biweekly') &&
        body.dayOfWeek === undefined
      ) {
        throw new BadRequestError('dayOfWeek é obrigatório para frequências weekly/biweekly');
      }
      if (
        (body.frequency === 'monthly' || body.frequency === 'quarterly') &&
        body.dayOfMonth === undefined
      ) {
        throw new BadRequestError('dayOfMonth é obrigatório para frequências monthly/quarterly');
      }

      const startDate = new Date(body.startDate);
      const endDate = body.endDate ? new Date(body.endDate) : null;
      if (endDate && endDate <= startDate) {
        throw new BadRequestError('Data de término deve ser posterior à data de início');
      }

      const nextRunAt = calculateNextRun(
        body.frequency,
        startDate,
        body.dayOfWeek ?? null,
        body.dayOfMonth ?? null
      );

      const scheduled = await fastify.prisma.scheduledQuestionnaire.create({
        data: {
          tenantId,
          templateId: body.templateId,
          patientId: body.patientId ?? null,
          frequency: body.frequency,
          dayOfWeek: body.dayOfWeek ?? null,
          dayOfMonth: body.dayOfMonth ?? null,
          startDate,
          endDate,
          nextRunAt,
        },
      });

      await auditLog(
        fastify.prisma,
        tenantId,
        'create',
        'scheduled_questionnaire',
        scheduled.id,
        user.userId,
        {
          templateId: body.templateId,
          patientId: body.patientId,
          frequency: body.frequency,
        }
      );

      return reply.status(201).send({
        id: scheduled.id,
        templateId: scheduled.templateId,
        frequency: scheduled.frequency,
        nextRunAt: scheduled.nextRunAt?.toISOString() ?? null,
      });
    }
  );

  fastify.get(
    '/v1/scheduled-questionnaires',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            patientId: { type: 'string' },
            templateId: { type: 'string' },
            active: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.readOnly(user.role);

      const query = listScheduledQuestionnairesQuerySchema.parse(request.query);
      const { page = 1, limit = 20 } = query;
      const skip = skipFor(page, limit);

      const where: {
        tenantId: string;
        deletedAt: null;
        patientId?: string;
        templateId?: string;
        active?: boolean;
      } = {
        tenantId,
        deletedAt: null,
      };

      if (query.patientId) where.patientId = query.patientId;
      if (query.templateId) where.templateId = query.templateId;
      if (query.active !== undefined) where.active = query.active;

      const [items, total] = await Promise.all([
        fastify.prisma.scheduledQuestionnaire.findMany({
          where,
          skip,
          take: limit,
          orderBy: { nextRunAt: 'asc' },
          include: {
            template: { select: { id: true, name: true } },
            patient: { select: { id: true, fullName: true } },
          },
        }),
        fastify.prisma.scheduledQuestionnaire.count({ where }),
      ]);

      return reply.status(200).send({
        data: items.map((s) => ({
          id: s.id,
          templateId: s.templateId,
          templateName: s.template.name,
          patientId: s.patientId,
          patientName: s.patient?.fullName ?? null,
          frequency: s.frequency,
          dayOfWeek: s.dayOfWeek,
          dayOfMonth: s.dayOfMonth,
          startDate: s.startDate.toISOString(),
          endDate: s.endDate?.toISOString() ?? null,
          nextRunAt: s.nextRunAt?.toISOString() ?? null,
          lastRunAt: s.lastRunAt?.toISOString() ?? null,
          active: s.active,
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

  fastify.patch(
    '/v1/scheduled-questionnaires/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          properties: {
            patientId: { type: 'string', nullable: true },
            frequency: {
              type: 'string',
              enum: ['weekly', 'biweekly', 'monthly', 'quarterly'],
            },
            dayOfWeek: { type: 'number', nullable: true },
            dayOfMonth: { type: 'number', nullable: true },
            endDate: { type: 'string', nullable: true },
            active: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.templates(user.role);

      const { id } = request.params as { id: string };
      const body = updateScheduledQuestionnaireSchema.parse(request.body);

      const existing = await fastify.prisma.scheduledQuestionnaire.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Agendamento não encontrado');

      const updateData: {
        patientId?: string | null;
        frequency?: string;
        dayOfWeek?: number | null;
        dayOfMonth?: number | null;
        endDate?: Date | null;
        active?: boolean;
        nextRunAt?: Date | null;
      } = {};

      if (body.patientId !== undefined) {
        if (body.patientId) {
          const patient = await fastify.prisma.patient.findFirst({
            where: { id: body.patientId, tenantId, deletedAt: null },
          });
          if (!patient) throw new NotFoundError('Paciente não encontrado');
        }
        updateData.patientId = body.patientId ?? null;
      }
      if (body.frequency !== undefined) updateData.frequency = body.frequency;
      if (body.dayOfWeek !== undefined) updateData.dayOfWeek = body.dayOfWeek ?? null;
      if (body.dayOfMonth !== undefined) updateData.dayOfMonth = body.dayOfMonth ?? null;
      if (body.endDate !== undefined) updateData.endDate = body.endDate ? new Date(body.endDate) : null;
      if (body.active !== undefined) updateData.active = body.active;

      if (body.frequency || body.dayOfWeek !== undefined || body.dayOfMonth !== undefined) {
        const frequency = (body.frequency ?? existing.frequency) as Frequency;
        const dayOfWeek = body.dayOfWeek !== undefined ? body.dayOfWeek : existing.dayOfWeek;
        const dayOfMonth = body.dayOfMonth !== undefined ? body.dayOfMonth : existing.dayOfMonth;
        updateData.nextRunAt = calculateNextRun(
          frequency,
          existing.startDate,
          dayOfWeek,
          dayOfMonth
        );
      }

      const scheduled = await fastify.prisma.scheduledQuestionnaire.update({
        where: { id },
        data: updateData,
      });

      await auditLog(fastify.prisma, tenantId, 'update', 'scheduled_questionnaire', id, user.userId, {
        changes: Object.keys(updateData),
      });

      return reply.status(200).send({
        id: scheduled.id,
        templateId: scheduled.templateId,
        frequency: scheduled.frequency,
        nextRunAt: scheduled.nextRunAt?.toISOString() ?? null,
        active: scheduled.active,
      });
    }
  );

  fastify.delete(
    '/v1/scheduled-questionnaires/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.templates(user.role);

      const { id } = request.params as { id: string };

      const existing = await fastify.prisma.scheduledQuestionnaire.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Agendamento não encontrado');

      await fastify.prisma.scheduledQuestionnaire.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await auditLog(
        fastify.prisma,
        tenantId,
        'delete',
        'scheduled_questionnaire',
        id,
        user.userId
      );

      return reply.status(204).send();
    }
  );
}
