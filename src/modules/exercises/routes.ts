import type { FastifyInstance } from 'fastify';
import type { Exercise as PrismaExercise } from '@prisma/client';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError } from '@shared/errors/index.js';
import { auditLog } from '@shared/utils/audit.js';
import {
  createExerciseSchema,
  updateExerciseSchema,
  listExercisesQuerySchema,
} from './schemas.js';
import * as service from './service.js';

export async function exercisesRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/v1/exercises',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            muscleGroup: { type: 'string', enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'other'] },
            search: { type: 'string' },
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
                    tenantId: { type: 'string' },
                    name: { type: 'string' },
                    muscleGroup: { type: 'string' },
                    equipment: { type: 'string', nullable: true },
                    videoUrl: { type: 'string', nullable: true },
                    isGlobal: { type: 'boolean' },
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
      Guards.readOnly(user.role);

      const query = listExercisesQuerySchema.parse(request.query);
      const result = await service.listExercises(fastify.prisma, tenantId, query);
      return reply.status(200).send({
        data: result.data.map((e: PrismaExercise) => ({
          id: e.id,
          tenantId: e.tenantId,
          name: e.name,
          muscleGroup: e.muscleGroup,
          equipment: e.equipment,
          videoUrl: e.videoUrl,
          isGlobal: e.isGlobal,
          createdAt: e.createdAt.toISOString(),
        })),
        meta: result.meta,
      });
    }
  );

  fastify.post(
    '/v1/exercises',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'muscleGroup'],
          properties: {
            name: { type: 'string' },
            muscleGroup: { type: 'string', enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'other'] },
            equipment: { type: 'string', nullable: true },
            videoUrl: { type: 'string', nullable: true },
          },
        },
        response: { 201: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const body = createExerciseSchema.parse(request.body);
      const exercise = await service.createExercise(fastify.prisma, tenantId, body);
      await auditLog(fastify.prisma, tenantId, 'create', 'exercise', exercise.id, user.userId, {
        name: exercise.name,
      });
      return reply.status(201).send({
        id: exercise.id,
        tenantId: exercise.tenantId,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        videoUrl: exercise.videoUrl,
        isGlobal: exercise.isGlobal,
        createdAt: exercise.createdAt.toISOString(),
      });
    }
  );

  fastify.get(
    '/v1/exercises/:id',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.readOnly(user.role);

      const { id } = request.params as { id: string };
      const exercise = await service.getExerciseById(fastify.prisma, id, tenantId);
      if (!exercise) throw new NotFoundError('Exercício não encontrado');
      return reply.status(200).send({
        id: exercise.id,
        tenantId: exercise.tenantId,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        videoUrl: exercise.videoUrl,
        isGlobal: exercise.isGlobal,
        createdAt: exercise.createdAt.toISOString(),
      });
    }
  );

  fastify.put(
    '/v1/exercises/:id',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            muscleGroup: { type: 'string' },
            equipment: { type: 'string', nullable: true },
            videoUrl: { type: 'string', nullable: true },
          },
        },
        response: { 200: { type: 'object', additionalProperties: true } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { id } = request.params as { id: string };
      const body = updateExerciseSchema.parse(request.body);
      const exercise = await service.updateExercise(fastify.prisma, id, tenantId, body);
      if (!exercise) throw new NotFoundError('Exercício não encontrado ou não pode ser editado');
      await auditLog(fastify.prisma, tenantId, 'update', 'exercise', id, user.userId);
      return reply.status(200).send({
        id: exercise.id,
        tenantId: exercise.tenantId,
        name: exercise.name,
        muscleGroup: exercise.muscleGroup,
        equipment: exercise.equipment,
        videoUrl: exercise.videoUrl,
        isGlobal: exercise.isGlobal,
        createdAt: exercise.createdAt.toISOString(),
      });
    }
  );

  fastify.delete(
    '/v1/exercises/:id',
    {
      schema: {
        params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
        response: { 204: { type: 'null' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { id } = request.params as { id: string };
      const deleted = await service.deleteExercise(fastify.prisma, id, tenantId);
      if (!deleted) throw new NotFoundError('Exercício não encontrado ou não pode ser excluído');
      await auditLog(fastify.prisma, tenantId, 'delete', 'exercise', id, user.userId);
      return reply.status(204).send();
    }
  );
}
