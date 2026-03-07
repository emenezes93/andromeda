import { apiFetch } from './client';
import type {
  Patient,
  PatientEvolution,
  PatientWithCount,
  PatientListResponse,
  PatientTimelineResponse,
  PatientHubSummaryResponse,
  CreatePatientBody,
  CreateEvolutionBody,
  PaginationMeta,
} from '@/types';

export interface ListPatientsParams {
  page?: number;
  limit?: number;
  search?: string;
  mainGoal?: string;
  hasActivePlan?: boolean;
  createdAfter?: string;
  createdBefore?: string;
}

export async function listPatients(params?: ListPatientsParams): Promise<PatientListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.search != null) search.set('search', params.search);
  if (params?.mainGoal != null) search.set('mainGoal', params.mainGoal);
  if (params?.hasActivePlan != null) search.set('hasActivePlan', String(params.hasActivePlan));
  if (params?.createdAfter != null) search.set('createdAfter', params.createdAfter);
  if (params?.createdBefore != null) search.set('createdBefore', params.createdBefore);
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

export async function getPatientTimeline(
  patientId: string,
  limit?: number
): Promise<PatientTimelineResponse> {
  const qs = limit != null ? `?limit=${limit}` : '';
  return apiFetch<PatientTimelineResponse>(`/v1/patients/${patientId}/timeline${qs}`);
}

export async function getPatientHubSummary(patientId: string): Promise<PatientHubSummaryResponse> {
  return apiFetch<PatientHubSummaryResponse>(`/v1/patients/${patientId}/hub-summary`);
}

export async function exportPatientsCSV(search?: string): Promise<void> {
  const url = `/v1/patients/export/csv${search ? `?search=${encodeURIComponent(search)}` : ''}`;
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['x-tenant-id'] = tenantId;

  const API_URL = import.meta.env.VITE_API_URL || '';
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  const res = await fetch(fullUrl, { headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? err.message ?? `Erro ${res.status}`);
  }

  const blob = await res.blob();
  const downloadUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = 'pacientes.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(downloadUrl);
}

export interface ImportPatientsResult {
  imported: number;
  failed: number;
  total: number;
  results: Array<{
    row: number;
    status: 'ok' | 'error';
    error?: string;
    patientId?: string;
  }>;
}

export async function importPatientsCSV(
  rows: Array<Record<string, string>>
): Promise<ImportPatientsResult> {
  return apiFetch<ImportPatientsResult>('/v1/patients/import', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  });
}
