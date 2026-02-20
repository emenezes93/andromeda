import type { IAuditService } from '@ports/services/IAuditService.js';
import type { ISessionRepository } from '@ports/repositories/ISessionRepository.js';
import { ConflictError, NotFoundError } from '@shared/errors/index.js';

export interface SignSessionRequest {
  sessionId: string;
  tenantId: string;
  actorUserId: string;
  signerName: string;
}

export interface SignSessionResponse {
  id: string;
  tenantId: string;
  templateId: string;
  subjectId: string | null;
  patientId: string | null;
  status: string;
  signatureName: string | null;
  signatureAgreedAt: Date | null;
  createdAt: Date;
}

export class SignSessionUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: SignSessionRequest): Promise<SignSessionResponse> {
    const session = await this.sessionRepository.findById(request.sessionId, request.tenantId);
    if (!session || session.isDeleted()) throw new NotFoundError('Session not found');
    if (session.signatureAgreedAt != null) throw new ConflictError('Sessão já assinada');
    const updated = await this.sessionRepository.updateSignature(
      request.sessionId,
      request.tenantId,
      request.signerName,
      new Date()
    );
    await this.auditService.log(
      request.tenantId,
      'sign',
      'session',
      request.sessionId,
      request.actorUserId,
      { signerName: request.signerName }
    );
    return {
      id: updated.id,
      tenantId: updated.tenantId,
      templateId: updated.templateId,
      subjectId: updated.subjectId,
      patientId: updated.patientId,
      status: updated.status,
      signatureName: updated.signatureName,
      signatureAgreedAt: updated.signatureAgreedAt,
      createdAt: updated.createdAt,
    };
  }
}
