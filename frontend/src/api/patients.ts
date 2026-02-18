import { apiFetch } from './client';
import type {
  Patient,
  PatientEvolution,
  PatientWithCount,
  PatientListResponse,
  CreatePatientBody,
  CreateEvolutionBody,
  PaginationMeta,
} from '@/types';

export interface ListPatientsParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function listPatients(params?: ListPatientsParams): Promise<PatientListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.search != null) search.set('search', params.search);
  const qs = search.toString();
  return apiFetch<PatientListResponse>(`/v1/patients${qs ? `?${qs}` : ''}`);
}

export async function getPatient(id: string): Promise<PatientWithCount> {
  return apiFetch<PatientWithCount>(`/v1/patients/${id}`);
}

export async function createPatient(body: CreatePatientBody): Promise<Patient> {
  return apiFetch<Patient>('/v1/patients', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updatePatient(id: string, body: Partial<CreatePatientBody>): Promise<Patient> {
  return apiFetch<Patient>(`/v1/patients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function listEvolutions(
  patientId: string
): Promise<{ data: PatientEvolution[]; meta: PaginationMeta }> {
  return apiFetch<{ data: PatientEvolution[]; meta: PaginationMeta }>(
    `/v1/patients/${patientId}/evolutions`
  );
}

export async function createEvolution(
  patientId: string,
  body: CreateEvolutionBody
): Promise<PatientEvolution> {
  return apiFetch<PatientEvolution>(`/v1/patients/${patientId}/evolutions`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
