import type { IAuditService } from '@ports/services/IAuditService.js';
import type { IPatientRepository } from '@ports/repositories/IPatientRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface UpdatePatientRequest {
  patientId: string;
  tenantId: string;
  actorUserId: string;
  fullName?: string;
  birthDate?: Date | null;
  gender?: string | null;
  cpf?: string | null;
  email?: string | null;
  phone?: string | null;
  profession?: string | null;
  mainGoal?: string | null;
  mainComplaint?: string | null;
  notes?: string | null;
  consentVersion?: string | null;
}

export interface UpdatePatientResponse {
  id: string;
  tenantId: string;
  fullName: string;
  birthDate: Date | null;
  gender: string | null;
  cpf: string | null;
  email: string | null;
  phone: string | null;
  profession: string | null;
  mainGoal: string | null;
  mainComplaint: string | null;
  notes: string | null;
  consentVersion: string | null;
  consentAcceptedAt: Date | null;
  userId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class UpdatePatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: UpdatePatientRequest): Promise<UpdatePatientResponse> {
    const existing = await this.patientRepository.findById(request.patientId, request.tenantId);
    if (!existing || existing.isDeleted()) throw new NotFoundError('Patient not found');
    const consentAcceptedAt =
      request.consentVersion !== undefined ? (request.consentVersion ? new Date() : null) : undefined;
    const updated = await this.patientRepository.update(request.patientId, request.tenantId, {
      fullName: request.fullName,
      birthDate: request.birthDate,
      gender: request.gender,
      cpf: request.cpf,
      email: request.email,
      phone: request.phone,
      profession: request.profession,
      mainGoal: request.mainGoal,
      mainComplaint: request.mainComplaint,
      notes: request.notes,
      consentVersion: request.consentVersion,
      ...(consentAcceptedAt !== undefined && { consentAcceptedAt }),
    });
    await this.auditService.log(
      request.tenantId,
      'update',
      'patient',
      updated.id,
      request.actorUserId,
      {}
    );
    return {
      id: updated.id,
      tenantId: updated.tenantId,
      fullName: updated.fullName,
      birthDate: updated.birthDate,
      gender: updated.gender,
      cpf: updated.cpf,
      email: updated.email,
      phone: updated.phone,
      profession: updated.profession,
      mainGoal: updated.mainGoal,
      mainComplaint: updated.mainComplaint,
      notes: updated.notes,
      consentVersion: updated.consentVersion,
      consentAcceptedAt: updated.consentAcceptedAt,
      userId: updated.userId,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }
}
