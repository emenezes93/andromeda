import type { ISessionRepository } from '@ports/repositories/ISessionRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface GetSessionRequest {
  sessionId: string;
  tenantId: string;
}

export interface GetSessionResponse {
  id: string;
  tenantId: string;
  templateId: string;
  subjectId: string | null;
  patientId: string | null;
  status: string;
  fillToken: string | null;
  signatureName: string | null;
  signatureAgreedAt: Date | null;
  createdAt: Date;
  currentAnswersJson: Record<string, unknown>;
}

export class GetSessionUseCase {
  constructor(private readonly sessionRepository: ISessionRepository) {}

  async execute(request: GetSessionRequest): Promise<GetSessionResponse> {
    const session = await this.sessionRepository.findById(request.sessionId, request.tenantId, { includeLatestAnswers: true });
    if (!session || session.isDeleted()) throw new NotFoundError('Session not found');
    return {
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
      currentAnswersJson: session.currentAnswersJson,
    };
  }
}
