import type { ISessionRepository } from '@ports/repositories/ISessionRepository.js';
import type { ITemplateRepository } from '@ports/repositories/ITemplateRepository.js';
import type { IQuestionEngine } from '@ports/services/IQuestionEngine.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface GetNextQuestionRequest {
  sessionId: string;
  tenantId: string;
  currentAnswers?: Record<string, unknown>;
}

export interface GetNextQuestionResponse {
  nextQuestion: unknown | null;
  reason: string;
  completionPercent: number;
}

export class GetNextQuestionUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly questionEngine: IQuestionEngine
  ) {}

  async execute(request: GetNextQuestionRequest): Promise<GetNextQuestionResponse> {
    const session = await this.sessionRepository.findById(request.sessionId, request.tenantId, { includeLatestAnswers: true });
    if (!session || session.isDeleted()) throw new NotFoundError('Session not found');
    const template = await this.templateRepository.findById(session.templateId, request.tenantId);
    if (!template || template.isDeleted()) throw new NotFoundError('Template not found');
    const answers = request.currentAnswers !== undefined ? request.currentAnswers : session.currentAnswersJson;
    return this.questionEngine.selectNextQuestion(template.schemaJson, answers);
  }
}
