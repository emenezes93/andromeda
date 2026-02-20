import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { Guards } from '@shared/utils/rbac.js';
import { NotFoundError } from '@shared/errors/index.js';
import { paginationQuerySchema } from '@shared/utils/pagination.js';
import { getIdempotencyKey, getRequestHash, withIdempotency } from '@shared/utils/idempotency.js';
import { createSessionSchema, createAnswersSchema, signSessionSchema } from '../../../schemas/sessions.js';
import { env } from '@config/env.js';
import type { ListSessionsUseCase } from '@application/use-cases/anamnesis/sessions/ListSessionsUseCase.js';
import type { GetSessionUseCase } from '@application/use-cases/anamnesis/sessions/GetSessionUseCase.js';
import type { CreateSessionUseCase } from '@application/use-cases/anamnesis/sessions/CreateSessionUseCase.js';
import type { AnswerQuestionUseCase } from '@application/use-cases/anamnesis/sessions/AnswerQuestionUseCase.js';
import type { SignSessionUseCase } from '@application/use-cases/anamnesis/sessions/SignSessionUseCase.js';
import type { GenerateFillLinkUseCase } from '@application/use-cases/anamnesis/sessions/GenerateFillLinkUseCase.js';
import type { GetNextQuestionUseCase } from '@application/use-cases/anamnesis/sessions/GetNextQuestionUseCase.js';
import type { PublicGetSessionByTokenUseCase } from '@application/use-cases/anamnesis/sessions/PublicGetSessionByTokenUseCase.js';
import type { PublicGetNextQuestionUseCase } from '@application/use-cases/anamnesis/sessions/PublicGetNextQuestionUseCase.js';
import type { PublicSubmitAnswerUseCase } from '@application/use-cases/anamnesis/sessions/PublicSubmitAnswerUseCase.js';
import type { PublicSignSessionUseCase } from '@application/use-cases/anamnesis/sessions/PublicSignSessionUseCase.js';
import type { GetTemplateUseCase } from '@application/use-cases/anamnesis/templates/GetTemplateUseCase.js';
import type { GetPatientUseCase } from '@application/use-cases/patients/GetPatientUseCase.js';

const RATE_LIMIT_SESSIONS = Number(env.RATE_LIMIT_SESSIONS) || 30;
const PUBLIC_RATE_LIMIT = 30;
const rateLimitConfig = { max: RATE_LIMIT_SESSIONS, timeWindow: '1 minute' as const };

export class SessionController {
  constructor(
    private readonly listSessionsUseCase: ListSessionsUseCase,
    private readonly getSessionUseCase: GetSessionUseCase,
    private readonly createSessionUseCase: CreateSessionUseCase,
    private readonly answerQuestionUseCase: AnswerQuestionUseCase,
    private readonly signSessionUseCase: SignSessionUseCase,
    private readonly generateFillLinkUseCase: GenerateFillLinkUseCase,
    private readonly getNextQuestionUseCase: GetNextQuestionUseCase,
    private readonly publicGetSessionByTokenUseCase: PublicGetSessionByTokenUseCase,
    private readonly publicGetNextQuestionUseCase: PublicGetNextQuestionUseCase,
    private readonly publicSubmitAnswerUseCase: PublicSubmitAnswerUseCase,
    private readonly publicSignSessionUseCase: PublicSignSessionUseCase,
    private readonly getTemplateUseCase: GetTemplateUseCase,
    private readonly getPatientUseCase: GetPatientUseCase,
    private readonly prisma: PrismaClient
  ) {}

  registerRoutes(app: FastifyInstance): void {
    // ——— Authenticated session routes ———
    app.get(
      '/v1/anamnesis/sessions',
      {
        config: { rateLimit: rateLimitConfig },
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
      this.list.bind(this)
    );

    app.post(
      '/v1/anamnesis/sessions',
      {
        config: { rateLimit: rateLimitConfig },
        schema: {
          body: { $ref: 'CreateSessionBody#' },
          response: { 201: { $ref: 'SessionResponse#' } },
        },
      },
      this.create.bind(this)
    );

    app.get(
      '/v1/anamnesis/sessions/:id',
      {
        config: { rateLimit: rateLimitConfig },
        schema: {
          params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
          response: { 200: { $ref: 'SessionResponse#' } },
        },
      },
      this.get.bind(this)
    );

    app.post(
      '/v1/anamnesis/sessions/:id/answers',
      {
        config: { rateLimit: rateLimitConfig },
        schema: {
          params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
          body: { $ref: 'CreateAnswersBody#' },
          response: { 201: { $ref: 'AnswerResponse#' } },
        },
      },
      this.addAnswers.bind(this)
    );

    app.post(
      '/v1/anamnesis/sessions/:id/sign',
      {
        config: { rateLimit: rateLimitConfig },
        schema: {
          params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
          body: { $ref: 'SignSessionBody#' },
          response: { 200: { $ref: 'SessionResponse#' } },
        },
      },
      this.sign.bind(this)
    );

    app.post(
      '/v1/anamnesis/sessions/:id/fill-link',
      {
        config: { rateLimit: rateLimitConfig },
        schema: {
          params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
          response: {
            200: {
              type: 'object',
              properties: { fillToken: { type: 'string' }, fillUrl: { type: 'string' } },
            },
          },
        },
      },
      this.generateFillLink.bind(this)
    );

    app.get(
      '/v1/anamnesis/sessions/:id/export',
      {
        config: { rateLimit: rateLimitConfig },
        schema: {
          params: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
          querystring: {
            type: 'object',
            properties: { format: { type: 'string', enum: ['json', 'pdf'] } },
          },
        },
      },
      this.exportSession.bind(this)
    );

    app.post(
      '/v1/anamnesis/engine/next-question',
      {
        schema: {
          body: { $ref: 'NextQuestionBody#' },
          response: { 200: { $ref: 'NextQuestionResponse#' } },
        },
      },
      this.nextQuestion.bind(this)
    );

    // ——— Public fill routes (no auth) ———
    app.get<{ Params: { token: string } }>(
      '/v1/public/fill/:token',
      {
        config: { rateLimit: { max: PUBLIC_RATE_LIMIT, timeWindow: '1 minute' } },
        schema: {
          params: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } },
        },
      },
      this.publicGetByToken.bind(this)
    );

    app.post<{ Params: { token: string }; Body: { answersJson?: Record<string, unknown> } }>(
      '/v1/public/fill/:token/next-question',
      {
        config: { rateLimit: { max: PUBLIC_RATE_LIMIT, timeWindow: '1 minute' } },
        schema: {
          params: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } },
          body: { type: 'object', properties: { answersJson: { type: 'object' } } },
        },
      },
      this.publicNextQuestion.bind(this)
    );

    app.post<{ Params: { token: string }; Body: { answersJson: Record<string, unknown> } }>(
      '/v1/public/fill/:token/answers',
      {
        config: { rateLimit: { max: PUBLIC_RATE_LIMIT, timeWindow: '1 minute' } },
        schema: {
          params: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } },
          body: { type: 'object', properties: { answersJson: { type: 'object' } } },
        },
      },
      this.publicSubmitAnswer.bind(this)
    );

    app.post<{ Params: { token: string } }>(
      '/v1/public/fill/:token/sign',
      {
        config: { rateLimit: { max: PUBLIC_RATE_LIMIT, timeWindow: '1 minute' } },
        schema: {
          params: { type: 'object', required: ['token'], properties: { token: { type: 'string' } } },
          body: { $ref: 'SignSessionBody#' },
        },
      },
      this.publicSign.bind(this)
    );
  }

  private async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
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
    const result = await this.listSessionsUseCase.execute({
      tenantId,
      page,
      limit,
      status: query.status,
      templateId: query.templateId,
      patientId: query.patientId,
    });
    await reply.status(200).send(result);
  }

  private async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.sessions(user.role);

    const body = createSessionSchema.parse(request.body);
    const idempotencyKey = getIdempotencyKey(request);
    const requestHash = getRequestHash(request);

    const handler = async () => {
      const session = await this.createSessionUseCase.execute({
        tenantId,
        templateId: body.templateId,
        subjectId: body.subjectId ?? null,
        patientId: body.patientId ?? null,
      });
      const [template, patient] = await Promise.all([
        this.getTemplateUseCase.execute({ templateId: session.templateId, tenantId }),
        session.patientId
          ? this.getPatientUseCase.execute({ patientId: session.patientId, tenantId }).catch(() => null)
          : Promise.resolve(null),
      ]);
      const response = {
        ...session,
        template: { id: template.id, name: template.name, schemaJson: template.schemaJson, version: template.version, createdAt: template.createdAt },
        patient: patient ? { id: patient.id, fullName: patient.fullName } : null,
        answers: [],
      };
      return { response, statusCode: 201 as const };
    };

    if (idempotencyKey) {
      const result = await withIdempotency(
        this.prisma,
        tenantId,
        idempotencyKey,
        requestHash,
        handler
      );
      await reply.status(result.statusCode).send(result.response);
      return;
    }
    const { response, statusCode } = await handler();
    await reply.status(statusCode).send(response);
  }

  private async get(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);

    const { id } = request.params;
    const session = await this.getSessionUseCase.execute({ sessionId: id, tenantId });
    const [template, patient] = await Promise.all([
      this.getTemplateUseCase.execute({ templateId: session.templateId, tenantId }),
      session.patientId
        ? this.getPatientUseCase.execute({ patientId: session.patientId, tenantId }).catch(() => null)
        : Promise.resolve(null),
    ]);
    const response = {
      id: session.id,
      tenantId: session.tenantId,
      templateId: session.templateId,
      subjectId: session.subjectId,
      patientId: session.patientId,
      status: session.status,
      fillToken: session.fillToken,
      signatureName: session.signatureName,
      signatureAgreedAt: session.signatureAgreedAt,
      createdAt: session.createdAt,
      template: { id: template.id, name: template.name, schemaJson: template.schemaJson, version: template.version, createdAt: template.createdAt },
      patient: patient ? { id: patient.id, fullName: patient.fullName } : null,
      answers: [{ answersJson: session.currentAnswersJson }],
    };
    await reply.status(200).send(response);
  }

  private async addAnswers(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.sessions(user.role);

    const { id: sessionId } = request.params;
    const body = createAnswersSchema.parse(request.body);
    const result = await this.answerQuestionUseCase.execute({
      sessionId,
      tenantId,
      answersJson: body.answersJson,
    });
    await reply.status(201).send(result.answer);
  }

  private async sign(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const tenantId = requireTenant(request);
    const user = requireAuth(request);
    Guards.sessions(user.role);

    const { id: sessionId } = request.params;
    const body = signSessionSchema.parse(request.body);
    const updated = await this.signSessionUseCase.execute({
      sessionId,
      tenantId,
      actorUserId: user.userId,
      signerName: body.signerName,
    });
    const [template, patient] = await Promise.all([
      this.getTemplateUseCase.execute({ templateId: updated.templateId, tenantId }),
      updated.patientId
        ? this.getPatientUseCase.execute({ patientId: updated.patientId, tenantId }).catch(() => null)
        : Promise.resolve(null),
    ]);
    const response = {
      ...updated,
      fillToken: null,
      template: { id: template.id, name: template.name },
      patient: patient ? { id: patient.id, fullName: patient.fullName } : null,
      answers: [],
    };
    await reply.status(200).send(response);
  }

  private async generateFillLink(
    request: FastifyRequest<{ Params: { id: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.sessions(request.user!.role);

    const { id: sessionId } = request.params;
    const baseUrl = (env.FRONTEND_URL ?? '').trim();
    const result = await this.generateFillLinkUseCase.execute({
      sessionId,
      tenantId,
      baseUrl: baseUrl || undefined,
    });
    await reply.status(200).send(result);
  }

  private async exportSession(
    request: FastifyRequest<{ Params: { id: string }; Querystring: { format?: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.readOnly(request.user!.role);

    const { id: sessionId } = request.params;
    const format = (request.query.format as string | undefined) || 'json';

    const session = await this.prisma.anamnesisSession.findFirst({
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
      await reply.status(200).send({
        session: {
          id: session.id,
          status: session.status,
          createdAt: session.createdAt,
          signatureName: session.signatureName,
          signatureAgreedAt: session.signatureAgreedAt,
        },
        template: { id: session.template.id, name: session.template.name },
        patient: session.patient
          ? { id: session.patient.id, fullName: session.patient.fullName }
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
      return;
    }

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
    ${session.signatureName && session.signatureAgreedAt ? `<p><strong>Assinado por:</strong> ${session.signatureName} em ${new Date(session.signatureAgreedAt).toLocaleString('pt-BR')}</p>` : ''}
  </div>
  <h2>Respostas</h2>
  ${questions.length === 0 ? '<p>Nenhuma resposta registrada.</p>' : questions.map((q) => {
    const value = answersJson[q.id];
    const displayValue = value === null || value === undefined ? '—' : Array.isArray(value) ? value.join(', ') : String(value);
    return `<div class="answer-item"><div class="answer-label">${q.text}</div><div class="answer-value">${displayValue}</div></div>`;
  }).join('')}
  ${insight ? `
  <h2>Insights e Análise</h2>
  <div class="insight">
    ${insight.summary ? `<p><strong>Resumo:</strong> ${insight.summary}</p>` : ''}
    ${insight.risksJson && typeof insight.risksJson === 'object' ? `<div class="risks">${Object.entries(insight.risksJson as Record<string, unknown>).map(([key, val]) => `<div class="risk-item"><div class="risk-label">${key === 'readiness' ? 'Disposição' : key === 'dropoutRisk' ? 'Risco de desistência' : key === 'stress' ? 'Estresse' : key === 'sleepQuality' ? 'Qualidade do sono' : key}</div><div class="risk-value">${typeof val === 'number' ? val : '—'}</div></div>`).join('')}</div>` : ''}
    ${insight.recommendationsJson && Array.isArray(insight.recommendationsJson) && insight.recommendationsJson.length > 0 ? `<div class="recommendations"><strong>Recomendações:</strong><ul>${(insight.recommendationsJson as string[]).map((r) => `<li>${r}</li>`).join('')}</ul></div>` : ''}
  </div>` : ''}
  ${session.signatureName && session.signatureAgreedAt ? `<div class="signature"><p><strong>Assinatura eletrônica:</strong></p><p>${session.signatureName}</p><p>Data: ${new Date(session.signatureAgreedAt).toLocaleString('pt-BR')}</p></div>` : ''}
</body>
</html>`;
    await reply.type('text/html').status(200).send(html);
  }

  private async nextQuestion(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const tenantId = requireTenant(request);
    requireAuth(request);
    Guards.sessions(request.user!.role);

    const body = request.body as { sessionId: string; currentAnswers?: Record<string, unknown> };
    const sessionId = body.sessionId;
    const currentAnswers = body.currentAnswers ?? {};
    const result = await this.getNextQuestionUseCase.execute({
      sessionId,
      tenantId,
      currentAnswers,
    });
    await reply.status(200).send(result);
  }

  private async publicGetByToken(
    request: FastifyRequest<{ Params: { token: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const { token } = request.params;
    const result = await this.publicGetSessionByTokenUseCase.execute({ token });
    await reply.status(200).send(result);
  }

  private async publicNextQuestion(
    request: FastifyRequest<{ Params: { token: string }; Body: { answersJson?: Record<string, unknown> } }>,
    reply: FastifyReply
  ): Promise<void> {
    const { token } = request.params;
    const body = (request.body ?? {}) as { answersJson?: Record<string, unknown> };
    const answersJson = body.answersJson ?? {};
    const result = await this.publicGetNextQuestionUseCase.execute({ token, answersJson });
    await reply.status(200).send(result);
  }

  private async publicSubmitAnswer(
    request: FastifyRequest<{ Params: { token: string }; Body: { answersJson: Record<string, unknown> } }>,
    reply: FastifyReply
  ): Promise<void> {
    const { token } = request.params;
    const body = request.body as { answersJson: Record<string, unknown> };
    const setTenantId = (request.server as { setTenantId?: (id: string) => Promise<void> }).setTenantId;
    const result = await this.publicSubmitAnswerUseCase.execute({
      token,
      answersJson: body.answersJson,
      setTenantId,
    });
    await reply.status(200).send(result);
  }

  private async publicSign(
    request: FastifyRequest<{ Params: { token: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const { token } = request.params;
    const body = signSessionSchema.parse(request.body);
    const setTenantId = (request.server as { setTenantId?: (id: string) => Promise<void> }).setTenantId;
    await this.publicSignSessionUseCase.execute({
      token,
      signerName: body.signerName,
      setTenantId,
    });
    await reply.status(200).send({ ok: true });
  }
}
