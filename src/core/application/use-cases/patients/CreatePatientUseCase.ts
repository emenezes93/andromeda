import type { IAuditService } from '@ports/services/IAuditService.js';
import type { IPatientRepository } from '@ports/repositories/IPatientRepository.js';
import { ConflictError } from '@shared/errors/index.js';

export interface CreatePatientRequest {
  tenantId: string;
  actorUserId: string;
  fullName: string;
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

export interface CreatePatientResponse {
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

export class CreatePatientUseCase {
  constructor(
    private readonly patientRepository: IPatientRepository,
    private readonly auditService: IAuditService
  ) {}

  async execute(request: CreatePatientRequest): Promise<CreatePatientResponse> {
    if (request.cpf) {
      const existing = await this.patientRepository.findByCpf(request.cpf, request.tenantId);
      if (existing) throw new ConflictError('CPF already registered for this tenant');
    }
    const consentAcceptedAt = request.consentVersion ? new Date() : undefined;
    const patient = await this.patientRepository.create({
      tenantId: request.tenantId,
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
      consentAcceptedAt,
    });
    await this.auditService.log(
      request.tenantId,
      'create',
      'patient',
      patient.id,
      request.actorUserId,
      {}
    );
    return {
      id: patient.id,
      tenantId: patient.tenantId,
      fullName: patient.fullName,
      birthDate: patient.birthDate,
      gender: patient.gender,
      cpf: patient.cpf,
      email: patient.email,
      phone: patient.phone,
      profession: patient.profession,
      mainGoal: patient.mainGoal,
      mainComplaint: patient.mainComplaint,
      notes: patient.notes,
      consentVersion: patient.consentVersion,
      consentAcceptedAt: patient.consentAcceptedAt,
      userId: patient.userId,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }
}
