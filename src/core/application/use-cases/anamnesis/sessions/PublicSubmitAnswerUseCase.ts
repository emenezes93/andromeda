import type { ISessionRepository } from '@ports/repositories/ISessionRepository.js';
import type { ITemplateRepository } from '@ports/repositories/ITemplateRepository.js';
import type { IQuestionEngine } from '@ports/services/IQuestionEngine.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface PublicSubmitAnswerRequest {
  token: string;
  answersJson: Record<string, unknown>;
  /** Optional: set tenant context before DB writes (e.g. for RLS in public flow) */
  setTenantId?: (tenantId: string) => void | Promise<void>;
}

export interface PublicSubmitAnswerResponse {
  completed: boolean;
}

export class PublicSubmitAnswerUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly questionEngine: IQuestionEngine
  ) {}

  async execute(request: PublicSubmitAnswerRequest): Promise<PublicSubmitAnswerResponse> {
    const session = await this.sessionRepository.findByPublicToken(request.token);
    if (!session || session.isDeleted()) {
      throw new NotFoundError('Invalid link or session not found');
    }
    if (session.status === 'completed') {
      return { completed: true };
    }
    if (request.setTenantId) {
      const r = request.setTenantId(session.tenantId);
      if (r instanceof Promise) await r;
    }
    const template = await this.templateRepository.findById(
      session.templateId,
      session.tenantId
    );
    if (!template || template.isDeleted()) throw new NotFoundError('Template not found');

    // Determine completion before writing (selectNextQuestion is pure / no side effects)
    const nextResult = this.questionEngine.selectNextQuestion(
      template.schemaJson,
      request.answersJson
    );
    const completed = nextResult.nextQuestion === null;

    // Save answers and optionally mark as completed in a single atomic operation
    if (completed) {
      await this.sessionRepository.addAnswersAndComplete(
        session.id,
        session.tenantId,
        request.answersJson
      );
    } else {
      await this.sessionRepository.addAnswers(
        session.id,
        session.tenantId,
        request.answersJson
      );
    }

    return { completed };
  }
}
