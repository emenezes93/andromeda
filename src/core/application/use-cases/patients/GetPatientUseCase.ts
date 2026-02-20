import type { IPatientRepository } from '@ports/repositories/IPatientRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export interface GetPatientRequest {
  patientId: string;
  tenantId: string;
}

export interface GetPatientResponse {
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

export class GetPatientUseCase {
  constructor(private readonly patientRepository: IPatientRepository) {}

  async execute(request: GetPatientRequest): Promise<GetPatientResponse> {
    const patient = await this.patientRepository.findById(request.patientId, request.tenantId);
    if (!patient || patient.isDeleted()) throw new NotFoundError('Patient not found');
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
