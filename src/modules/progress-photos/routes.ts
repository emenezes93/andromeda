import type { FastifyInstance } from 'fastify';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError } from '@shared/errors/index.js';
import {
  createProgressPhotoSchema,
  updateProgressPhotoSchema,
  listProgressPhotosQuerySchema,
} from './schemas.js';
import { auditLog } from '@shared/utils/audit.js';
import { skipFor } from '@shared/utils/pagination.js';

export async function progressPhotosRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.post(
    '/v1/progress-photos',
    {
      schema: {
        body: {
          type: 'object',
          required: ['patientId', 'imageUrl', 'takenAt'],
          properties: {
            patientId: { type: 'string' },
            imageUrl: { type: 'string' },
            takenAt: { type: 'string' },
            notes: { type: 'string', nullable: true },
          },
        },
        response: {
          201: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              patientId: { type: 'string' },
              imageUrl: { type: 'string' },
              takenAt: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const body = createProgressPhotoSchema.parse(request.body);

      const patient = await fastify.prisma.patient.findFirst({
        where: { id: body.patientId, tenantId, deletedAt: null },
      });
      if (!patient) throw new NotFoundError('Paciente não encontrado');

      const photo = await fastify.prisma.progressPhoto.create({
        data: {
          tenantId,
          patientId: body.patientId,
          imageUrl: body.imageUrl,
          takenAt: new Date(body.takenAt),
          notes: body.notes ?? null,
        },
      });

      await auditLog(fastify.prisma, tenantId, 'create', 'progress_photo', photo.id, user.userId, {
        patientId: body.patientId,
      });

      return reply.status(201).send({
        id: photo.id,
        patientId: photo.patientId,
        imageUrl: photo.imageUrl,
        takenAt: photo.takenAt.toISOString(),
      });
    }
  );

  fastify.get(
    '/v1/progress-photos',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            patientId: { type: 'string' },
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

      const query = listProgressPhotosQuerySchema.parse(request.query);
      const { page = 1, limit = 20 } = query;
      const skip = skipFor(page, limit);

      const where: {
        tenantId: string;
        deletedAt: null;
        patientId?: string;
        takenAt?: { gte?: Date; lte?: Date };
      } = { tenantId, deletedAt: null };
      if (query.patientId) where.patientId = query.patientId;
      if (query.from || query.to) {
        where.takenAt = {};
        if (query.from) where.takenAt.gte = new Date(query.from);
        if (query.to) where.takenAt.lte = new Date(query.to);
      }

      const [items, total] = await Promise.all([
        fastify.prisma.progressPhoto.findMany({
          where,
          skip,
          take: limit,
          orderBy: { takenAt: 'desc' },
          include: {
            patient: { select: { id: true, fullName: true } },
          },
        }),
        fastify.prisma.progressPhoto.count({ where }),
      ]);

      return reply.status(200).send({
        data: items.map((p) => ({
          id: p.id,
          patientId: p.patientId,
          patientName: p.patient.fullName,
          imageUrl: p.imageUrl,
          takenAt: p.takenAt.toISOString(),
          notes: p.notes,
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
    '/v1/progress-photos/:id',
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

      const photo = await fastify.prisma.progressPhoto.findFirst({
        where: { id, tenantId, deletedAt: null },
        include: {
          patient: { select: { id: true, fullName: true } },
        },
      });
      if (!photo) throw new NotFoundError('Foto de progresso não encontrada');

      return reply.status(200).send({
        id: photo.id,
        patientId: photo.patientId,
        patientName: photo.patient.fullName,
        imageUrl: photo.imageUrl,
        takenAt: photo.takenAt.toISOString(),
        notes: photo.notes,
      });
    }
  );

  fastify.patch(
    '/v1/progress-photos/:id',
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
            imageUrl: { type: 'string' },
            takenAt: { type: 'string' },
            notes: { type: 'string', nullable: true },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { id } = request.params as { id: string };
      const body = updateProgressPhotoSchema.parse(request.body);

      const existing = await fastify.prisma.progressPhoto.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Foto de progresso não encontrada');

      const updateData: {
        imageUrl?: string;
        takenAt?: Date;
        notes?: string | null;
      } = {};
      if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
      if (body.takenAt !== undefined) updateData.takenAt = new Date(body.takenAt);
      if (body.notes !== undefined) updateData.notes = body.notes ?? null;

      const photo = await fastify.prisma.progressPhoto.update({
        where: { id },
        data: updateData,
      });

      await auditLog(fastify.prisma, tenantId, 'update', 'progress_photo', id, user.userId);
      return reply.status(200).send({
        id: photo.id,
        imageUrl: photo.imageUrl,
        takenAt: photo.takenAt.toISOString(),
        notes: photo.notes,
      });
    }
  );

  fastify.delete(
    '/v1/progress-photos/:id',
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

      const existing = await fastify.prisma.progressPhoto.findFirst({
        where: { id, tenantId, deletedAt: null },
      });
      if (!existing) throw new NotFoundError('Foto de progresso não encontrada');

      await fastify.prisma.progressPhoto.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await auditLog(fastify.prisma, tenantId, 'delete', 'progress_photo', id, user.userId);
      return reply.status(204).send();
    }
  );
}
