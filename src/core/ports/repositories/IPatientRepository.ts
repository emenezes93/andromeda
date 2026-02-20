import type { Patient } from '@domain/entities/Patient.js';

export interface PatientCreateData {
  tenantId: string;
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
  consentAcceptedAt?: Date | null;
  userId?: string | null;
}

export interface PatientUpdateData {
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
  consentAcceptedAt?: Date | null;
  userId?: string | null;
}

/**
 * Port: Patient Repository Interface
 */
export interface IPatientRepository {
  findAll(
    tenantId: string,
    opts: { page: number; limit: number; search?: string }
  ): Promise<{ data: Patient[]; total: number }>;
  findById(id: string, tenantId: string): Promise<Patient | null>;
  findByCpf(cpf: string, tenantId: string): Promise<Patient | null>;
  create(data: PatientCreateData): Promise<Patient>;
  update(id: string, tenantId: string, data: PatientUpdateData): Promise<Patient>;
  delete(id: string, tenantId: string): Promise<void>;
}
