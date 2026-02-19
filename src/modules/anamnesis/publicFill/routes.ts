import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NotFoundError, ConflictError } from '@shared/errors/index.js';
import { getNextQuestion } from '../engine/engine.js';
import type { TemplateSchemaJson } from '@shared/types/index.js';
import { signSessionSchema } from '../sessions/schemas.js';

const PUBLIC_RATE_LIMIT = 30;

export async function publicFillRoutes(fastify: FastifyInstance): Promise<void> {
  async function getSessionByToken(token: string) {
    return fastify.prisma.anamnesisSession.findFirst({
      where: { fillToken: token, deletedAt: null },
      include: {
        template: { select: { schemaJson: true, name: true } },
        answers: { orderBy: { createdAt: 'desc' }, take: 1, select: { answersJson: true } },
      },
    });
  }

  // GET /v1/public/fill/:token — dados da sessão + schema do template para montar o formulário
  fastify.get<{ Params: { token: string } }>(
    '/v1/public/fill/:token',
    {
      config: { rateLimit: { max: PUBLIC_RATE_LIMIT, timeWindow: '1 minute' } },
      schema: {
        params: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
          required: ['token'],
        },
      },
    },
    async (request, reply) => {
      const { token } = request.params;
      const session = await getSessionByToken(token);
      if (!session) throw new NotFoundError('Link inválido ou sessão não encontrada');
      if (session.status === 'completed') {
        throw new NotFoundError('Esta sessão já foi concluída');
      }
      const lastAnswers =
        session.answers[0]?.answersJson && typeof session.answers[0].answersJson === 'object'
          ? (session.answers[0].answersJson as Record<string, unknown>)
          : {};
      return reply.status(200).send({
        sessionId: session.id,
        status: session.status,
        templateName: session.template.name,
        schema: session.template.schemaJson,
        currentAnswers: lastAnswers,
      });
    }
  );

  // POST /v1/public/fill/:token/next-question — próxima pergunta (engine)
  fastify.post<{
    Params: { token: string };
    Body: { answersJson: Record<string, unknown> };
  }>(
    '/v1/public/fill/:token/next-question',
    {
      config: { rateLimit: { max: PUBLIC_RATE_LIMIT, timeWindow: '1 minute' } },
      schema: {
        params: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
          required: ['token'],
        },
        body: { type: 'object', properties: { answersJson: { type: 'object' } } },
      },
    },
    async (request, reply) => {
      const { token } = request.params;
      const body = z.object({ answersJson: z.record(z.unknown()).default({}) }).parse(request.body);
      const session = await getSessionByToken(token);
      if (!session) throw new NotFoundError('Link inválido ou sessão não encontrada');
      if (session.status === 'completed') {
        throw new NotFoundError('Esta sessão já foi concluída');
      }
      await fastify.setTenantId(session.tenantId);
      const schema = session.template.schemaJson as unknown as TemplateSchemaJson;
      const result = getNextQuestion(schema, body.answersJson);
      return reply.status(200).send(result);
    }
  );

  // POST /v1/public/fill/:token/answers — grava respostas; se conclusão, marca sessão completed
  fastify.post<{
    Params: { token: string };
    Body: { answersJson: Record<string, unknown> };
  }>(
    '/v1/public/fill/:token/answers',
    {
      config: { rateLimit: { max: PUBLIC_RATE_LIMIT, timeWindow: '1 minute' } },
      schema: {
        params: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
          required: ['token'],
        },
        body: { type: 'object', properties: { answersJson: { type: 'object' } } },
      },
    },
    async (request, reply) => {
      const { token } = request.params;
      const body = z.object({ answersJson: z.record(z.unknown()) }).parse(request.body);
      const session = await getSessionByToken(token);
      if (!session) throw new NotFoundError('Link inválido ou sessão não encontrada');
      if (session.status === 'completed') {
        return reply.status(200).send({ completed: true });
      }
      await fastify.setTenantId(session.tenantId);
      const schema = session.template.schemaJson as unknown as TemplateSchemaJson;
      const isComplete = getNextQuestion(schema, body.answersJson).nextQuestion === null;

      await fastify.prisma.anamnesisAnswer.create({
        data: {
          tenantId: session.tenantId,
          sessionId: session.id,
          answersJson: body.answersJson as object,
        },
      });

      if (isComplete) {
        await fastify.prisma.anamnesisSession.update({
          where: { id: session.id, tenantId: session.tenantId },
          data: { status: 'completed' },
        });
      }

      return reply.status(200).send({ completed: isComplete });
    }
  );

  // POST /v1/public/fill/:token/sign — assinatura eletrônica (fluxo público)
  fastify.post<{
    Params: { token: string };
    Body: { signerName: string; agreed: boolean };
  }>(
    '/v1/public/fill/:token/sign',
    {
      config: { rateLimit: { max: PUBLIC_RATE_LIMIT, timeWindow: '1 minute' } },
      schema: {
        params: {
          type: 'object',
          properties: {
            token: { type: 'string' },
          },
          required: ['token'],
        },
        body: { $ref: 'SignSessionBody#' },
      },
    },
    async (request, reply) => {
      const { token } = request.params;
      const body = signSessionSchema.parse(request.body);
      const session = await getSessionByToken(token);
      if (!session) throw new NotFoundError('Link inválido ou sessão não encontrada');
      if (session.signatureAgreedAt != null) {
        throw new ConflictError('Sessão já assinada');
      }
      await fastify.setTenantId(session.tenantId);
      await fastify.prisma.anamnesisSession.update({
        where: { id: session.id, tenantId: session.tenantId },
        data: {
          signatureName: body.signerName,
          signatureAgreedAt: new Date(),
          status: 'completed',
        },
      });
      return reply.status(200).send({ ok: true });
    }
  );
}
