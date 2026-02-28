import { apiFetch } from './client';
import type { Goal, GoalListResponse, CreateGoalBody, UpdateGoalBody } from '@/types';

export interface ListGoalsParams {
  page?: number;
  limit?: number;
  patientId?: string;
  type?: string;
  achieved?: boolean;
}

export async function listGoals(params?: ListGoalsParams): Promise<GoalListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.patientId) search.set('patientId', params.patientId);
  if (params?.type) search.set('type', params.type);
  if (params?.achieved != null) search.set('achieved', String(params.achieved));
  const qs = search.toString();
  return apiFetch<GoalListResponse>(`/v1/goals${qs ? `?${qs}` : ''}`);
}

export async function getGoal(id: string): Promise<Goal> {
  return apiFetch<Goal>(`/v1/goals/${id}`);
}

export async function createGoal(body: CreateGoalBody): Promise<Goal> {
  return apiFetch<Goal>('/v1/goals', { method: 'POST', body: JSON.stringify(body) });
}

export async function updateGoal(id: string, body: UpdateGoalBody): Promise<Goal> {
  return apiFetch<Goal>(`/v1/goals/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
}

export async function deleteGoal(id: string): Promise<void> {
  return apiFetch<void>(`/v1/goals/${id}`, { method: 'DELETE' });
}
