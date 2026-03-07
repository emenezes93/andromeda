import { apiFetch } from './client';
import type {
  TrainingPlan,
  TrainingPlanListResponse,
  CreateTrainingPlanBody,
} from '@/types';

export interface ListTrainingPlansParams {
  page?: number;
  limit?: number;
  patientId?: string;
  active?: boolean;
  name?: string;
}

export async function listTrainingPlans(
  params?: ListTrainingPlansParams
): Promise<TrainingPlanListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.patientId != null) search.set('patientId', params.patientId);
  if (params?.active != null) search.set('active', String(params.active));
  if (params?.name) search.set('name', params.name);
  const qs = search.toString();
  return apiFetch<TrainingPlanListResponse>(`/v1/training-plans${qs ? `?${qs}` : ''}`);
}

export async function getTrainingPlan(id: string): Promise<TrainingPlan> {
  return apiFetch<TrainingPlan>(`/v1/training-plans/${id}`);
}

export async function createTrainingPlan(body: CreateTrainingPlanBody): Promise<TrainingPlan> {
  return apiFetch<TrainingPlan>('/v1/training-plans', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateTrainingPlan(
  id: string,
  body: Partial<CreateTrainingPlanBody>
): Promise<TrainingPlan> {
  return apiFetch<TrainingPlan>(`/v1/training-plans/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteTrainingPlan(id: string): Promise<void> {
  return apiFetch<void>(`/v1/training-plans/${id}`, { method: 'DELETE' });
}

export interface DuplicateTrainingPlanBody {
  patientId: string;
  name?: string;
}

export interface DuplicateTrainingPlanResponse {
  id: string;
  patientId: string;
  patientName: string;
  name: string;
  startDate: string;
}

export async function duplicateTrainingPlan(
  id: string,
  body: DuplicateTrainingPlanBody
): Promise<DuplicateTrainingPlanResponse> {
  return apiFetch<DuplicateTrainingPlanResponse>(
    `/v1/training-plans/${id}/duplicate`,
    { method: 'POST', body: JSON.stringify(body) }
  );
}
