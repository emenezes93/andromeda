import type { FastifyInstance } from 'fastify';
import { createSessionSchema, createAnswersSchema } from './schemas.js';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError } from '@shared/errors/index.js';
import { skipFor } from '@shared/utils/pagination.js';
import { paginationQuerySchema } from '@shared/utils/pagination.js';
import { getIdempotencyKey, getRequestHash, withIdempotency } from '@shared/utils/idempotency.js';
import { env } from '@config/env.js';

export async function sessionsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get(
    '/v1/anamnesis/sessions',
    {
      config: { rateLimit: { max: env.RATE_LIMIT_SESSIONS, timeWindow: '1 minute' } },
      schema: {
        querystring: {
          page: { type: 'number' },
          limit: { type: 'number' },
          status: { type: 'string' },
          templateId: { type: 'string' },
        },
        response: { 200: { $ref: 'SessionListResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);

      const query = request.query as { page?: number; limit?: number; status?: string; templateId?: string };
      const { page, limit } = paginationQuerySchema.parse(query);
      const skip = skipFor(page, limit);

      const where: { tenantId: string; status?: string; templateId?: string } = { tenantId };
      if (query.status) where.status = query.status;
      if (query.templateId) where.templateId = query.templateId;

      const [items, total] = await Promise.all([
        fastify.prisma.anamnesisSession.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { template: true, patient: true },
        }),
        fastify.prisma.anamnesisSession.count({ where }),
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

  fastify.post(
    '/v1/anamnesis/sessions',
    {
      config: { rateLimit: { max: env.RATE_LIMIT_SESSIONS, timeWindow: '1 minute' } },
      schema: {
        body: { $ref: 'CreateSessionBody#' },
        response: { 201: { $ref: 'SessionResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const body = createSessionSchema.parse(request.body);
      const template = await fastify.prisma.anamnesisTemplate.findFirst({
        where: { id: body.templateId, tenantId },
      });
      if (!template) throw new NotFoundError('Template not found');

      const idempotencyKey = getIdempotencyKey(request);
      const requestHash = getRequestHash(request);

      const handler = async () => {
        if (body.patientId) {
          const patient = await fastify.prisma.patient.findFirst({
            where: { id: body.patientId, tenantId },
          });
          if (!patient) throw new NotFoundError('Patient not found');
        }
        const session = await fastify.prisma.anamnesisSession.create({
          data: {
            tenantId,
            templateId: body.templateId,
            subjectId: body.subjectId ?? null,
            patientId: body.patientId ?? null,
          },
          include: { template: true, patient: true },
        });
        return { response: session, statusCode: 201 };
      };

      if (idempotencyKey) {
        const result = await withIdempotency(
          fastify.prisma,
          tenantId,
          idempotencyKey,
          requestHash,
          handler
        );
        return reply.status(result.statusCode).send(result.response);
      }
      const { response, statusCode } = await handler();
      return reply.status(statusCode).send(response);
    }
  );

  fastify.get(
    '/v1/anamnesis/sessions/:id',
    {
      config: { rateLimit: { max: env.RATE_LIMIT_SESSIONS, timeWindow: '1 minute' } },
      schema: {
        params: { id: { type: 'string' } },
        response: { 200: { $ref: 'SessionResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);

      const { id } = request.params as { id: string };
      const session = await fastify.prisma.anamnesisSession.findFirst({
        where: { id, tenantId },
        include: { template: true, patient: true, answers: true },
      });
      if (!session) throw new NotFoundError('Session not found');
      return reply.status(200).send(session);
    }
  );

  fastify.post(
    '/v1/anamnesis/sessions/:id/answers',
    {
      config: { rateLimit: { max: env.RATE_LIMIT_SESSIONS, timeWindow: '1 minute' } },
      schema: {
        params: { id: { type: 'string' } },
        body: { $ref: 'CreateAnswersBody#' },
        response: { 201: { $ref: 'AnswerResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { id: sessionId } = request.params as { id: string };
      const body = createAnswersSchema.parse(request.body);

      const session = await fastify.prisma.anamnesisSession.findFirst({
        where: { id: sessionId, tenantId },
      });
      if (!session) throw new NotFoundError('Session not found');

      const idempotencyKey = getIdempotencyKey(request);
      const requestHash = getRequestHash(request);

      const handler = async () => {
        const answer = await fastify.prisma.anamnesisAnswer.create({
          data: {
            tenantId,
            sessionId,
            answersJson: body.answersJson as object,
          },
        });
        return { response: answer, statusCode: 201 };
      };

      if (idempotencyKey) {
        const result = await withIdempotency(
          fastify.prisma,
          tenantId,
          idempotencyKey,
          requestHash,
          handler
        );
        return reply.status(result.statusCode).send(result.response);
      }
      const { response, statusCode } = await handler();
      return reply.status(statusCode).send(response);
    }
  );
}
