import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError } from '@shared/errors/index.js';

const dashboardQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  days: z.coerce.number().int().min(1).max(365).optional(),
});

export async function statsRoutes(fastify: FastifyInstance): Promise<void> {
  // GET /v1/stats/dashboard — métricas do dashboard com filtro de período
  fastify.get(
    '/v1/stats/dashboard',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
            days: { type: 'number' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);

      const query = dashboardQuerySchema.parse(request.query);
      let fromDate: Date;
      let toDate: Date = new Date();

      if (query.days) {
        fromDate = new Date(toDate.getTime() - query.days * 24 * 60 * 60 * 1000);
      } else if (query.from) {
        fromDate = new Date(query.from);
      } else {
        fromDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      if (query.to) {
        toDate = new Date(query.to);
      }

      const where = {
        tenantId,
        deletedAt: null,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      };

      const [
        totalSessions,
        completedSessions,
        totalTemplates,
        sessionsByDay,
        sessionsByTemplate,
      ] = await Promise.all([
        fastify.prisma.anamnesisSession.count({ where }),
        fastify.prisma.anamnesisSession.count({
          where: { ...where, status: 'completed' },
        }),
        fastify.prisma.anamnesisTemplate.count({
          where: { tenantId, deletedAt: null },
        }),
        fastify.prisma.anamnesisSession.groupBy({
          by: ['createdAt'],
          where,
          _count: true,
        }),
        fastify.prisma.anamnesisSession.groupBy({
          by: ['templateId'],
          where,
          _count: true,
        }),
      ]);

      const templateIds = sessionsByTemplate.map((s) => s.templateId);
      const templates = await fastify.prisma.anamnesisTemplate.findMany({
        where: { id: { in: templateIds }, tenantId },
        select: { id: true, name: true },
      });
      const templateMap = new Map(templates.map((t) => [t.id, t.name]));

      const byDay = sessionsByDay.reduce(
        (acc, item) => {
          const date = item.createdAt.toISOString().slice(0, 10);
          acc[date] = (acc[date] || 0) + item._count;
          return acc;
        },
        {} as Record<string, number>
      );

      const byTemplate = sessionsByTemplate.map((item) => ({
        templateId: item.templateId,
        templateName: templateMap.get(item.templateId) ?? item.templateId.slice(0, 8),
        count: item._count,
      }));

      return reply.status(200).send({
        period: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
        totals: {
          sessions: totalSessions,
          completed: completedSessions,
          templates: totalTemplates,
        },
        byDay,
        byTemplate: byTemplate.sort((a, b) => b.count - a.count),
      });
    }
  );

  // GET /v1/stats/templates/:id — relatório por template (sessões, taxa de conclusão)
  fastify.get<{ Params: { id: string }; Querystring: { from?: string; to?: string; days?: number } }>(
    '/v1/stats/templates/:id',
    {
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        querystring: {
          type: 'object',
          properties: {
            from: { type: 'string' },
            to: { type: 'string' },
            days: { type: 'number' },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);

      const { id: templateId } = request.params;
      const query = dashboardQuerySchema.parse(request.query);

      const template = await fastify.prisma.anamnesisTemplate.findFirst({
        where: { id: templateId, tenantId, deletedAt: null },
      });
      if (!template) throw new NotFoundError('Template not found');

      let fromDate: Date;
      let toDate: Date = new Date();

      if (query.days) {
        fromDate = new Date(toDate.getTime() - query.days * 24 * 60 * 60 * 1000);
      } else if (query.from) {
        fromDate = new Date(query.from);
      } else {
        fromDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      if (query.to) {
        toDate = new Date(query.to);
      }

      const where = {
        tenantId,
        templateId,
        deletedAt: null,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      };

      const [total, completed, sessions] = await Promise.all([
        fastify.prisma.anamnesisSession.count({ where }),
        fastify.prisma.anamnesisSession.count({
          where: { ...where, status: 'completed' },
        }),
        fastify.prisma.anamnesisSession.findMany({
          where,
          select: {
            id: true,
            status: true,
            createdAt: true,
            answers: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { createdAt: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

      const sessionsWithDuration = sessions.map((s) => {
        const firstAnswer = s.answers[0];
        if (!firstAnswer || s.status !== 'completed') return null;
        const durationMs =
          new Date(firstAnswer.createdAt).getTime() - new Date(s.createdAt).getTime();
        return durationMs > 0 ? durationMs : null;
      });

      const validDurations = sessionsWithDuration.filter(
        (d): d is number => d !== null && d > 0
      );
      const avgDurationMs =
        validDurations.length > 0
          ? validDurations.reduce((a, b) => a + b, 0) / validDurations.length
          : null;
      const avgDurationMinutes = avgDurationMs ? Math.round(avgDurationMs / (1000 * 60)) : null;

      return reply.status(200).send({
        template: {
          id: template.id,
          name: template.name,
        },
        period: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
        metrics: {
          totalSessions: total,
          completedSessions: completed,
          completionRate,
          avgDurationMinutes,
        },
        sessions: sessions.map((s) => ({
          id: s.id,
          status: s.status,
          createdAt: s.createdAt.toISOString(),
        })),
      });
    }
  );
}
