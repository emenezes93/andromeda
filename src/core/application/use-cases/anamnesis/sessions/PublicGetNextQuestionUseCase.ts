import type { ISessionRepository } from '@ports/repositories/ISessionRepository.js';
import type { ITemplateRepository } from '@ports/repositories/ITemplateRepository.js';
import type { IQuestionEngine } from '@ports/services/IQuestionEngine.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface PublicGetNextQuestionRequest {
  token: string;
  answersJson: Record<string, unknown>;
}

export interface PublicGetNextQuestionResponse {
  nextQuestion: unknown | null;
  reason: string;
  completionPercent: number;
}

export class PublicGetNextQuestionUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly questionEngine: IQuestionEngine
  ) {}

  async execute(
    request: PublicGetNextQuestionRequest
  ): Promise<PublicGetNextQuestionResponse> {
    const session = await this.sessionRepository.findByPublicToken(request.token);
    if (!session || session.isDeleted()) {
      throw new NotFoundError('Invalid link or session not found');
    }
    if (session.status === 'completed') {
      throw new NotFoundError('Session already completed');
    }
    const template = await this.templateRepository.findById(
      session.templateId,
      session.tenantId
    );
    if (!template || template.isDeleted()) throw new NotFoundError('Template not found');
    return this.questionEngine.selectNextQuestion(
      template.schemaJson,
      request.answersJson
    );
  }
}
