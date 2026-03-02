import { apiFetch } from './client';
import type {
  TrainingExecution,
  TrainingExecutionListResponse,
  CreateTrainingExecutionBody,
  UpdateTrainingExecutionBody,
} from '@/types';

export interface ListTrainingExecutionsParams {
  page?: number;
  limit?: number;
  patientId?: string;
  trainingPlanId?: string;
}

export async function listTrainingExecutions(
  params?: ListTrainingExecutionsParams
): Promise<TrainingExecutionListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.patientId != null) search.set('patientId', params.patientId);
  if (params?.trainingPlanId != null) search.set('trainingPlanId', params.trainingPlanId);
  const qs = search.toString();
  return apiFetch<TrainingExecutionListResponse>(`/v1/training-executions${qs ? `?${qs}` : ''}`);
}

export async function createTrainingExecution(
  body: CreateTrainingExecutionBody
): Promise<TrainingExecution> {
  return apiFetch<TrainingExecution>('/v1/training-executions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateTrainingExecution(
  id: string,
  body: UpdateTrainingExecutionBody
): Promise<TrainingExecution> {
  return apiFetch<TrainingExecution>(`/v1/training-executions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteTrainingExecution(id: string): Promise<void> {
  return apiFetch<void>(`/v1/training-executions/${id}`, { method: 'DELETE' });
}
