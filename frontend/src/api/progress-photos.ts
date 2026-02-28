import { apiFetch } from './client';
import type {
  ProgressPhoto,
  ProgressPhotoListResponse,
  CreateProgressPhotoBody,
} from '@/types';

export interface ListProgressPhotosParams {
  page?: number;
  limit?: number;
  patientId?: string;
}

export async function listProgressPhotos(
  params?: ListProgressPhotosParams
): Promise<ProgressPhotoListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.patientId != null) search.set('patientId', params.patientId);
  const qs = search.toString();
  return apiFetch<ProgressPhotoListResponse>(`/v1/progress-photos${qs ? `?${qs}` : ''}`);
}

export async function createProgressPhoto(body: CreateProgressPhotoBody): Promise<ProgressPhoto> {
  return apiFetch<ProgressPhoto>('/v1/progress-photos', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateProgressPhoto(
  id: string,
  body: Partial<CreateProgressPhotoBody>
): Promise<ProgressPhoto> {
  return apiFetch<ProgressPhoto>(`/v1/progress-photos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteProgressPhoto(id: string): Promise<void> {
  return apiFetch<void>(`/v1/progress-photos/${id}`, { method: 'DELETE' });
}
