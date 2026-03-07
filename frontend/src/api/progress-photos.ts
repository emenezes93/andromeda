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

/** P1.1 — Upload real de arquivo (multipart). Retorna a foto criada com imageUrl relativo (/v1/progress-photos/:id/file). */
export async function createProgressPhotoUpload(
  formData: FormData
): Promise<ProgressPhoto> {
  const API_URL = import.meta.env.VITE_API_URL || '';
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');
  const headers: HeadersInit = {};
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  if (tenantId) (headers as Record<string, string>)['x-tenant-id'] = tenantId;
  const res = await fetch(`${API_URL}/v1/progress-photos/upload`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = (err as { message?: string })?.message ?? (err as { error?: string })?.error ?? `Upload falhou: ${res.status}`;
    throw new Error(msg);
  }
  const data = await res.json();
  return data as ProgressPhoto;
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
