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
          type: 'object',
          properties: {
            page: { type: 'number' },
            limit: { type: 'number' },
            status: { type: 'string' },
            templateId: { type: 'string' },
            patientId: { type: 'string' },
          },
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
        return reply.status(result.statusCode as 201).send(result.response);
      }
      const { response, statusCode } = await handler();
      return reply.status(statusCode as 201).send(response);
    }
  );

  fastify.get(
    '/v1/anamnesis/sessions/:id',
    {
      config: { rateLimit: { max: env.RATE_LIMIT_SESSIONS, timeWindow: '1 minute' } },
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
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
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
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
        return reply.status(result.statusCode as 201).send(result.response);
      }
      const { response, statusCode } = await handler();
      return reply.status(statusCode as 201).send(response);
    }
  );

  // POST /v1/anamnesis/sessions/:id/sign — assinatura eletrônica da anamnese
  fastify.post(
    '/v1/anamnesis/sessions/:id/sign',
    {
      config: { rateLimit: { max: env.RATE_LIMIT_SESSIONS, timeWindow: '1 minute' } },
      schema: {
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
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
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
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

  // GET /v1/anamnesis/sessions/:id/export — exporta sessão em PDF ou JSON
  fastify.get<{ Params: { id: string }; Querystring: { format?: string } }>(
    '/v1/anamnesis/sessions/:id/export',
    {
      config: { rateLimit: { max: env.RATE_LIMIT_SESSIONS, timeWindow: '1 minute' } },
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
            format: { type: 'string', enum: ['json', 'pdf'] },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);
      Guards.readOnly(request.user!.role);

      const { id: sessionId } = request.params;
      const format = (request.query.format as string | undefined) || 'json';

      const session = await fastify.prisma.anamnesisSession.findFirst({
        where: { id: sessionId, tenantId },
        include: {
          template: true,
          patient: true,
          answers: { orderBy: { createdAt: 'desc' }, take: 1 },
          aiInsights: true,
        },
      });
      if (!session) throw new NotFoundError('Session not found');

      const lastAnswer = session.answers[0];
      const answersJson =
        lastAnswer && lastAnswer.answersJson && typeof lastAnswer.answersJson === 'object'
          ? (lastAnswer.answersJson as Record<string, unknown>)
          : {};
      const insight = session.aiInsights[0];
      const templateSchema =
        session.template.schemaJson && typeof session.template.schemaJson === 'object'
          ? (session.template.schemaJson as { questions?: Array<{ id: string; text: string }> })
          : { questions: [] };

      if (format === 'json') {
        return reply.status(200).send({
          session: {
            id: session.id,
            status: session.status,
            createdAt: session.createdAt,
            signatureName: session.signatureName,
            signatureAgreedAt: session.signatureAgreedAt,
          },
          template: {
            id: session.template.id,
            name: session.template.name,
          },
          patient: session.patient
            ? {
                id: session.patient.id,
                fullName: session.patient.fullName,
              }
            : null,
          answers: answersJson,
          insight: insight
            ? {
                summary: insight.summary,
                risksJson: insight.risksJson,
                recommendationsJson: insight.recommendationsJson,
                createdAt: insight.createdAt,
              }
            : null,
        });
      }

      // PDF: retorna HTML formatado para impressão
      const questions = templateSchema.questions ?? [];
      const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anamnese - ${session.template.name}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.6; }
    h1 { color: #0ea5e9; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px; }
    h2 { color: #0369a1; margin-top: 30px; }
    .meta { background: #f0f9ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .meta p { margin: 5px 0; }
    .answer-item { margin: 15px 0; padding: 10px; background: #f9fafb; border-left: 3px solid #0ea5e9; }
    .answer-label { font-weight: bold; color: #0369a1; }
    .answer-value { margin-top: 5px; }
    .insight { background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .risks { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin: 15px 0; }
    .risk-item { padding: 10px; background: white; border-radius: 4px; }
    .risk-label { font-weight: bold; }
    .risk-value { font-size: 24px; color: #0ea5e9; }
    .recommendations { margin-top: 15px; }
    .recommendations ul { list-style: none; padding: 0; }
    .recommendations li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .signature { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; }
    @media print { body { margin: 20px; } }
  </style>
</head>
<body>
  <h1>Anamnese - ${session.template.name}</h1>
  
  <div class="meta">
    <p><strong>Data:</strong> ${new Date(session.createdAt).toLocaleString('pt-BR')}</p>
    <p><strong>Status:</strong> ${session.status === 'completed' ? 'Concluída' : 'Em andamento'}</p>
    ${session.patient ? `<p><strong>Paciente:</strong> ${session.patient.fullName}</p>` : ''}
    ${session.signatureName && session.signatureAgreedAt
        ? `<p><strong>Assinado por:</strong> ${session.signatureName} em ${new Date(session.signatureAgreedAt).toLocaleString('pt-BR')}</p>`
        : ''}
  </div>

  <h2>Respostas</h2>
  ${questions.length === 0
      ? '<p>Nenhuma resposta registrada.</p>'
      : questions
          .map((q) => {
            const value = answersJson[q.id];
            const displayValue =
              value === null || value === undefined
                ? '—'
                : Array.isArray(value)
                  ? value.join(', ')
                  : String(value);
            return `
    <div class="answer-item">
      <div class="answer-label">${q.text}</div>
      <div class="answer-value">${displayValue}</div>
    </div>
  `;
          })
          .join('')}

  ${insight
        ? `
  <h2>Insights e Análise</h2>
  <div class="insight">
    ${insight.summary ? `<p><strong>Resumo:</strong> ${insight.summary}</p>` : ''}
    ${insight.risksJson && typeof insight.risksJson === 'object'
            ? `
    <div class="risks">
      ${Object.entries(insight.risksJson as Record<string, unknown>)
                .map(
                  ([key, val]) => `
      <div class="risk-item">
        <div class="risk-label">${key === 'readiness' ? 'Disposição' : key === 'dropoutRisk' ? 'Risco de desistência' : key === 'stress' ? 'Estresse' : key === 'sleepQuality' ? 'Qualidade do sono' : key}</div>
        <div class="risk-value">${typeof val === 'number' ? val : '—'}</div>
      </div>
    `
                )
                .join('')}
    </div>
    `
            : ''}
    ${insight.recommendationsJson &&
            Array.isArray(insight.recommendationsJson) &&
            insight.recommendationsJson.length > 0
            ? `
    <div class="recommendations">
      <strong>Recomendações:</strong>
      <ul>
        ${(insight.recommendationsJson as string[]).map((r) => `<li>${r}</li>`).join('')}
      </ul>
    </div>
    `
            : ''}
  </div>
  `
        : ''}

  ${session.signatureName && session.signatureAgreedAt
        ? `
  <div class="signature">
    <p><strong>Assinatura eletrônica:</strong></p>
    <p>${session.signatureName}</p>
    <p>Data: ${new Date(session.signatureAgreedAt).toLocaleString('pt-BR')}</p>
  </div>
  `
        : ''}
</body>
</html>
      `;

      reply.type('text/html').status(200).send(html);
    }
  );
}
