import type { ISessionRepository } from '@ports/repositories/ISessionRepository.js';
import type { ITemplateRepository } from '@ports/repositories/ITemplateRepository.js';
import type { IPatientRepository } from '@ports/repositories/IPatientRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface CreateSessionRequest {
  tenantId: string;
  templateId: string;
  subjectId?: string | null;
  patientId?: string | null;
}

export interface CreateSessionResponse {
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
}

export class CreateSessionUseCase {
  constructor(
    private readonly sessionRepository: ISessionRepository,
    private readonly templateRepository: ITemplateRepository,
    private readonly patientRepository: IPatientRepository
  ) {}

  async execute(request: CreateSessionRequest): Promise<CreateSessionResponse> {
    const template = await this.templateRepository.findById(request.templateId, request.tenantId);
    if (!template || template.isDeleted()) throw new NotFoundError('Template not found');
    if (request.patientId) {
      const patient = await this.patientRepository.findById(request.patientId, request.tenantId);
      if (!patient || patient.isDeleted()) throw new NotFoundError('Patient not found');
    }
    const session = await this.sessionRepository.create({
      tenantId: request.tenantId,
      templateId: request.templateId,
      subjectId: request.subjectId,
      patientId: request.patientId,
    });
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
    };
  }
}

