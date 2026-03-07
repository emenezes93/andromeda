import type { FastifyInstance } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError } from '@shared/errors/index.js';
import { z } from 'zod';

const listAlertsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  severity: z.enum(['high', 'medium', 'low', 'info']).optional(),
  read: z.enum(['true', 'false']).optional(),
  patientId: z.string().optional(),
});

export async function alertsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/v1/alerts',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            severity: { type: 'string', enum: ['high', 'medium', 'low', 'info'] },
            read: { type: 'string', enum: ['true', 'false'] },
            patientId: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    patientId: { type: 'string' },
                    patientName: { type: 'string' },
                    type: { type: 'string' },
                    severity: { type: 'string' },
                    message: { type: 'string' },
                    metadata: { type: 'object' },
                    readAt: { type: 'string', nullable: true },
                    createdAt: { type: 'string' },
                  },
                },
              },
              meta: {
                type: 'object',
                properties: {
                  page: { type: 'number' },
                  limit: { type: 'number' },
                  total: { type: 'number' },
                  totalPages: { type: 'number' },
                  unreadCount: { type: 'number' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);

      const query = listAlertsQuerySchema.parse(request.query);
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: { tenantId: string; patientId?: string; severity?: string; readAt?: null | { not: null } } = {
        tenantId,
      };
      if (query.patientId) where.patientId = query.patientId;
      if (query.severity) where.severity = query.severity;
      if (query.read === 'true') where.readAt = { not: null };
      else if (query.read === 'false') where.readAt = null;

      const [items, total, unreadCount] = await Promise.all([
        fastify.prisma.alert.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { patient: { select: { id: true, fullName: true } } },
        }),
        fastify.prisma.alert.count({ where }),
        fastify.prisma.alert.count({ where: { tenantId, readAt: null } }),
      ]);

      return reply.status(200).send({
        data: items.map((a) => ({
          id: a.id,
          patientId: a.patientId,
          patientName: a.patient.fullName,
          type: a.type,
          severity: a.severity,
          message: a.message,
          metadata: a.metadata as Record<string, unknown> | null,
          readAt: a.readAt?.toISOString() ?? null,
          createdAt: a.createdAt.toISOString(),
        })),
        meta: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit) || 1,
          unreadCount,
        },
      });
    }
  );

  fastify.patch<{ Params: { id: string } }>(
    '/v1/alerts/:id/read',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
        response: {
          200: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              readAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.sessions(request.user!.role);

      const { id } = request.params;

      const alert = await fastify.prisma.alert.findFirst({
        where: { id, tenantId },
      });
      if (!alert) throw new NotFoundError('Alerta não encontrado');

      const updated = await fastify.prisma.alert.update({
        where: { id },
        data: { readAt: new Date() },
      });

      return reply.status(200).send({
        id: updated.id,
        readAt: updated.readAt!.toISOString(),
      });
    }
  );
}
