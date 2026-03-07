import { apiFetch } from './client';
import type { Exercise, ExerciseListResponse, CreateExerciseBody } from '@/types';

export interface ListExercisesParams {
  page?: number;
  limit?: number;
  muscleGroup?: string;
  search?: string;
}

export async function listExercises(
  params?: ListExercisesParams
): Promise<ExerciseListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.muscleGroup) search.set('muscleGroup', params.muscleGroup);
  if (params?.search) search.set('search', params.search);
  const qs = search.toString();
  return apiFetch<ExerciseListResponse>(`/v1/exercises${qs ? `?${qs}` : ''}`);
}

export async function getExercise(id: string): Promise<Exercise> {
  return apiFetch<Exercise>(`/v1/exercises/${id}`);
}

export async function createExercise(body: CreateExerciseBody): Promise<Exercise> {
  return apiFetch<Exercise>('/v1/exercises', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateExercise(
  id: string,
  body: Partial<CreateExerciseBody>
): Promise<Exercise> {
  return apiFetch<Exercise>(`/v1/exercises/${id}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteExercise(id: string): Promise<void> {
  return apiFetch<void>(`/v1/exercises/${id}`, { method: 'DELETE' });
}
