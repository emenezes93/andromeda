import type { ISessionRepository } from '@ports/repositories/ISessionRepository.js';
import type { ITemplateRepository } from '@ports/repositories/ITemplateRepository.js';
import type { IQuestionEngine } from '@ports/services/IQuestionEngine.js';
import { NotFoundError, ConflictError } from '@shared/errors/index.js';

export interface AnswerQuestionRequest {
  sessionId: string;
  tenantId: string;
  answersJson: Record<string, unknown>;
}

export interface AnswerQuestionResponse {
  answer: { id: string; sessionId: string; answersJson: Record<string, unknown>; createdAt: Date };
  completed: boolean;
}

export class AnswerQuestionUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly questionEngine: IQuestionEngine
  ) {}

  async execute(request: AnswerQuestionRequest): Promise<AnswerQuestionResponse> {
    const session = await this.sessionRepository.findById(request.sessionId, request.tenantId);
    if (!session || session.isDeleted()) throw new NotFoundError('Session not found');
    if (!session.canReceiveAnswer()) throw new ConflictError('Session is not accepting answers');
    const template = await this.templateRepository.findById(session.templateId, request.tenantId);
    if (!template || template.isDeleted()) throw new NotFoundError('Template not found');
    // Determine completion before writing (selectNextQuestion is pure / no side effects)
    const nextResult = this.questionEngine.selectNextQuestion(
      template.schemaJson,
      request.answersJson
    );
    const completed = nextResult.nextQuestion === null;

    // Save answers and optionally mark as completed in a single atomic operation
    const answer = completed
      ? await this.sessionRepository.addAnswersAndComplete(
          request.sessionId,
          request.tenantId,
          request.answersJson
        )
      : await this.sessionRepository.addAnswers(
          request.sessionId,
          request.tenantId,
          request.answersJson
        );

    return { answer, completed };
  }
}
