import type { FastifyInstance } from 'fastify';
import crypto from 'node:crypto';
import { createSessionSchema, createAnswersSchema, signSessionSchema } from './schemas.js';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError, ConflictError } from '@shared/errors/index.js';
import { auditLog } from '@shared/utils/audit.js';
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
          patientId: { type: 'string' },
        },
        response: { 200: { $ref: 'SessionListResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);

      const query = request.query as {
        page?: number;
        limit?: number;
        status?: string;
        templateId?: string;
        patientId?: string;
      };
      const { page, limit } = paginationQuerySchema.parse(query);
      const skip = skipFor(page, limit);

      const where: {
        tenantId: string;
        status?: string;
        templateId?: string;
        patientId?: string | null;
      } = { tenantId };
      if (query.status) where.status = query.status;
      if (query.templateId) where.templateId = query.templateId;
      if (query.patientId) where.patientId = query.patientId;

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

  // POST /v1/anamnesis/sessions/:id/sign — assinatura eletrônica da anamnese
  fastify.post(
    '/v1/anamnesis/sessions/:id/sign',
    {
      config: { rateLimit: { max: env.RATE_LIMIT_SESSIONS, timeWindow: '1 minute' } },
      schema: {
        params: { id: { type: 'string' } },
        body: { $ref: 'SignSessionBody#' },
        response: { 200: { $ref: 'SessionResponse#' } },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      Guards.sessions(user.role);

      const { id: sessionId } = request.params as { id: string };
      const body = signSessionSchema.parse(request.body);

      const session = await fastify.prisma.anamnesisSession.findFirst({
        where: { id: sessionId, tenantId },
        include: { template: true, patient: true },
      });
      if (!session) throw new NotFoundError('Session not found');
      if (session.signatureAgreedAt != null) {
        throw new ConflictError('Sessão já assinada');
      }

      const updated = await fastify.prisma.anamnesisSession.update({
        where: { id: sessionId, tenantId },
        data: {
          signatureName: body.signerName,
          signatureAgreedAt: new Date(),
          status: 'completed',
        },
        include: { template: true, patient: true },
      });

      await auditLog(
        fastify.prisma,
        tenantId,
        'sign',
        'session',
        sessionId,
        user.userId,
        { signerName: body.signerName }
      );

      return reply.status(200).send(updated);
    }
  );

  // POST /v1/anamnesis/sessions/:id/fill-link — gera token para link público (idempotente)
  fastify.post(
    '/v1/anamnesis/sessions/:id/fill-link',
    {
      config: { rateLimit: { max: env.RATE_LIMIT_SESSIONS, timeWindow: '1 minute' } },
      schema: {
        params: { id: { type: 'string' } },
        response: {
          200: {
            type: 'object',
            properties: {
              fillToken: { type: 'string' },
              fillUrl: { type: 'string' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.sessions(request.user!.role);

      const { id: sessionId } = request.params as { id: string };

      const session = await fastify.prisma.anamnesisSession.findFirst({
        where: { id: sessionId, tenantId },
      });
      if (!session) throw new NotFoundError('Session not found');
      if (session.status === 'completed') {
        throw new ConflictError('Cannot generate fill link for completed session');
      }

      let fillToken = session.fillToken;
      if (!fillToken) {
        fillToken = crypto.randomBytes(16).toString('hex');
        await fastify.prisma.anamnesisSession.update({
          where: { id: sessionId, tenantId },
          data: { fillToken },
        });
      }

      const baseUrl = env.FRONTEND_URL?.trim() || '';
      const fillUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/fill/${fillToken}` : `/fill/${fillToken}`;

      return reply.status(200).send({ fillToken, fillUrl });
    }
  );
}
