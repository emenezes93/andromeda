import { apiFetch } from './client';
import type {
  DietPlan,
  DietPlanListResponse,
  CreateDietPlanBody,
  DietEntry,
  DietEntryListResponse,
  CreateDietEntryBody,
  DietStats,
} from '@/types';

export interface ListDietPlansParams {
  page?: number;
  limit?: number;
  patientId?: string;
  active?: boolean;
  name?: string;
}

export async function listDietPlans(params?: ListDietPlansParams): Promise<DietPlanListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.patientId) search.set('patientId', params.patientId);
  if (params?.active != null) search.set('active', String(params.active));
  if (params?.name) search.set('name', params.name);
  const qs = search.toString();
  return apiFetch<DietPlanListResponse>(`/v1/diet-plans${qs ? `?${qs}` : ''}`);
}

export async function getDietPlan(id: string): Promise<DietPlan> {
  return apiFetch<DietPlan>(`/v1/diet-plans/${id}`);
}

export async function createDietPlan(body: CreateDietPlanBody): Promise<DietPlan> {
  return apiFetch<DietPlan>('/v1/diet-plans', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateDietPlan(
  id: string,
  body: Partial<CreateDietPlanBody>
): Promise<DietPlan> {
  return apiFetch<DietPlan>(`/v1/diet-plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteDietPlan(id: string): Promise<void> {
  return apiFetch<void>(`/v1/diet-plans/${id}`, { method: 'DELETE' });
}

// Diet Entries

export interface ListDietEntriesParams {
  patientId?: string;
  dietPlanId?: string;
  from?: string;
  to?: string;
  mealType?: string;
  page?: number;
  limit?: number;
}

export async function listDietEntries(
  params?: ListDietEntriesParams
): Promise<DietEntryListResponse> {
  const search = new URLSearchParams();
  if (params?.patientId) search.set('patientId', params.patientId);
  if (params?.dietPlanId) search.set('dietPlanId', params.dietPlanId);
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  if (params?.mealType) search.set('mealType', params.mealType);
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch<DietEntryListResponse>(`/v1/diet-entries${qs ? `?${qs}` : ''}`);
}

export async function createDietEntry(body: CreateDietEntryBody): Promise<DietEntry> {
  return apiFetch<DietEntry>('/v1/diet-entries', { method: 'POST', body: JSON.stringify(body) });
}

export async function deleteDietEntry(id: string): Promise<void> {
  return apiFetch<void>(`/v1/diet-entries/${id}`, { method: 'DELETE' });
}

// Diet Stats (gamification + body metrics)

export async function getDietStats(patientId: string): Promise<DietStats> {
  return apiFetch<DietStats>(`/v1/diet-stats/${patientId}`);
}
