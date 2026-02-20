import type { ISessionRepository } from '@ports/repositories/ISessionRepository.js';
import type { ITemplateRepository } from '@ports/repositories/ITemplateRepository.js';
import type { IInsightRepository } from '@ports/repositories/IInsightRepository.js';
import type { IInsightGenerator } from '@ports/services/IInsightGenerator.js';
import type { IInsightCache } from '@ports/services/IInsightCache.js';
import type { IAuditService } from '@ports/services/IAuditService.js';
import { NotFoundError } from '@shared/errors/index.js';
import type { Insight } from '@domain/entities/Insight.js';
import { generateAnswersHash } from '@shared/utils/answersHash.js';
import type { TemplateSchemaJson } from '@shared/types/index.js';

export interface GenerateInsightsRequest {
  sessionId: string;
  tenantId: string;
  actorUserId?: string;
  useCache?: boolean;
}

interface ILogger {
  warn(msg: string, data?: unknown): void;
}

export class GenerateInsightsUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly insightRepository: IInsightRepository,
    private readonly insightGenerator: IInsightGenerator,
    private readonly insightCache: IInsightCache | null,
    private readonly auditService: IAuditService,
    private readonly logger: ILogger = console
  ) {}

  async execute(request: GenerateInsightsRequest): Promise<Insight> {
    const session = await this.sessionRepository.findById(
      request.sessionId,
      request.tenantId,
      { includeLatestAnswers: true }
    );
    if (!session || session.isDeleted()) throw new NotFoundError('Session not found');

    const existing = await this.insightRepository.findBySessionId(
      request.sessionId,
      request.tenantId
    );
    if (existing) return existing;

    const template = await this.templateRepository.findById(
      session.templateId,
      request.tenantId
    );
    if (!template || template.isDeleted()) throw new NotFoundError('Template not found');

    const answers = session.currentAnswersJson ?? {};
    const schema = template.schemaJson as TemplateSchemaJson;
    const questions = schema?.questions ?? [];
    const answersHash = generateAnswersHash({ questions }, answers);

    if (request.useCache && this.insightCache) {
      const cached = await this.insightCache.get(request.tenantId, answersHash);
      if (cached && cached.sessionId !== request.sessionId) {
        const created = await this.insightRepository.create({
          tenantId: request.tenantId,
          sessionId: request.sessionId,
          summary: cached.summary ?? '',
          risksJson: cached.risksJson ?? {},
          recommendationsJson: cached.recommendationsJson ?? [],
          answersHash,
        });
        await this.auditService.log(
          request.tenantId,
          'generate_insight',
          'insight',
          created.id,
          request.actorUserId ?? 'system',
          { sessionId: request.sessionId, fromCache: true }
        );
        return created;
      }

      const similar = await this.insightRepository.findByAnswersHash(
        request.tenantId,
        answersHash
      );
      if (similar && similar.sessionId !== request.sessionId) {
        const created = await this.insightRepository.create({
          tenantId: request.tenantId,
          sessionId: request.sessionId,
          summary: similar.summary,
          risksJson: similar.risksJson as unknown as Record<string, number>,
          recommendationsJson: similar.recommendationsJson,
          answersHash,
        });
        if (this.insightCache) {
          await this.insightCache
            .set(request.tenantId, answersHash, {
              sessionId: created.sessionId,
              summary: created.summary,
              risksJson: created.risksJson as unknown as Record<string, number>,
              recommendationsJson: created.recommendationsJson,
            }, 7 * 24 * 60 * 60)
            .catch((err: unknown) =>
              this.logger.warn('Cache write failed (similar hit)', { err, sessionId: request.sessionId })
            );
        }
        await this.auditService.log(
          request.tenantId,
          'generate_insight',
          'insight',
          created.id,
          request.actorUserId ?? 'system',
          { sessionId: request.sessionId, fromSimilar: true }
        );
        return created;
      }
    }

    const payload = await this.insightGenerator.generate(session, template);
    const created = await this.insightRepository.create({
      tenantId: request.tenantId,
      sessionId: request.sessionId,
      summary: payload.summary,
      risksJson: payload.risks,
      recommendationsJson: payload.recommendations,
      answersHash: request.useCache ? answersHash : null,
    });

    if (request.useCache && this.insightCache) {
      await this.insightCache
        .set(request.tenantId, answersHash, {
          sessionId: created.sessionId,
          summary: created.summary,
          risksJson: created.risksJson as unknown as Record<string, number>,
          recommendationsJson: created.recommendationsJson,
        }, 7 * 24 * 60 * 60)
        .catch((err: unknown) =>
          this.logger.warn('Cache write failed (new insight)', { err, sessionId: request.sessionId })
        );
    }

    await this.auditService.log(
      request.tenantId,
      'generate_insight',
      'insight',
      created.id,
      request.actorUserId ?? 'system',
      { sessionId: request.sessionId }
    );

    return created;
  }
}
