import type { ISessionRepository } from '@ports/repositories/ISessionRepository.js';
import type { ITemplateRepository } from '@ports/repositories/ITemplateRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface PublicGetSessionByTokenRequest {
  token: string;
}

export interface PublicGetSessionByTokenResponse {
  sessionId: string;
  tenantId: string;
  status: string;
  templateName: string;
  schema: unknown;
  currentAnswers: Record<string, unknown>;
}

export class PublicGetSessionByTokenUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly templateRepository: ITemplateRepository
  ) {}

  async execute(request: PublicGetSessionByTokenRequest): Promise<PublicGetSessionByTokenResponse> {
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
    if (!template) throw new NotFoundError('Template not found');
    return {
      sessionId: session.id,
      tenantId: session.tenantId,
      status: session.status,
      templateName: template.name,
      schema: template.schemaJson,
      currentAnswers: session.currentAnswersJson,
    };
  }
}
