import type { FastifyInstance } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { NotFoundError, UnauthorizedError } from '@shared/errors/index.js';

export async function registerPatientPortalNotificationRoutes(
  fastify: FastifyInstance
): Promise<void> {
  fastify.get(
    '/v1/patient-portal/my-notifications',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
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
                    type: { type: 'string' },
                    metadata: {},
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
                  hasMore: { type: 'boolean' },
                },
              },
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

      const { page = 1, limit = 20 } = request.query as { page?: number; limit?: number };
      const take = Math.min(Math.max(1, limit), 100);
      const skip = (page - 1) * take;

      const where = { tenantId, patientId };
      const [items, total] = await Promise.all([
        fastify.prisma.patientNotification.findMany({
          where,
          skip,
          take,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            type: true,
            metadata: true,
            readAt: true,
            createdAt: true,
          },
        }),
        fastify.prisma.patientNotification.count({ where }),
      ]);

      return reply.status(200).send({
        data: items.map((n) => ({
          id: n.id,
          type: n.type,
          metadata: n.metadata ?? undefined,
          readAt: n.readAt?.toISOString() ?? null,
          createdAt: n.createdAt.toISOString(),
        })),
        meta: {
          page,
          limit: take,
          total,
          totalPages: Math.ceil(total / take) || 1,
          hasMore: page * take < total,
        },
      });
    }
  );

  fastify.patch(
    '/v1/patient-portal/my-notifications/mark-as-read',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            ids: { type: 'array', items: { type: 'string' } },
            all: { type: 'boolean' },
          },
        },
        response: { 200: { type: 'object', properties: { updated: { type: 'number' } } } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const body = (request.body as { ids?: string[]; all?: boolean }) ?? {};
      const now = new Date();
      const whereBase = { tenantId, patientId };

      if (body.all) {
        const result = await fastify.prisma.patientNotification.updateMany({
          where: { ...whereBase, readAt: null },
          data: { readAt: now },
        });
        return reply.status(200).send({ updated: result.count });
      }
      if (Array.isArray(body.ids) && body.ids.length > 0) {
        const result = await fastify.prisma.patientNotification.updateMany({
          where: { id: { in: body.ids }, ...whereBase },
          data: { readAt: now },
        });
        return reply.status(200).send({ updated: result.count });
      }
      return reply.status(200).send({ updated: 0 });
    }
  );

  fastify.patch(
    '/v1/patient-portal/my-notifications/:id/read',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
        response: {
          200: { type: 'object', properties: { id: { type: 'string' }, readAt: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      const patientId = user.patientId;
      if (!patientId) throw new UnauthorizedError('Acesso restrito a pacientes');

      const { id } = request.params as { id: string };
      const n = await fastify.prisma.patientNotification.findFirst({
        where: { id, tenantId, patientId },
      });
      if (!n) throw new NotFoundError('Notificação não encontrada');
      const updated = await fastify.prisma.patientNotification.update({
        where: { id },
        data: { readAt: new Date() },
        select: { id: true, readAt: true },
      });
      return reply.status(200).send({
        id: updated.id,
        readAt: updated.readAt!.toISOString(),
      });
    }
  );
}
