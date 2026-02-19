import type { Session, SessionListResponse } from '@/types';
import { apiFetch } from './client';

export interface ListSessionsParams {
  page?: number;
  limit?: number;
  status?: string;
  templateId?: string;
  patientId?: string;
}

export async function listSessions(params: ListSessionsParams = {}): Promise<SessionListResponse> {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.status) search.set('status', params.status);
  if (params.templateId) search.set('templateId', params.templateId);
  if (params.patientId) search.set('patientId', params.patientId);
  const qs = search.toString();
  return apiFetch<SessionListResponse>(`/v1/anamnesis/sessions${qs ? `?${qs}` : ''}`);
}

export async function getSession(id: string): Promise<Session> {
  return apiFetch<Session>(`/v1/anamnesis/sessions/${id}`);
}

export async function createSession(
  templateId: string,
  options?: { subjectId?: string; patientId?: string }
): Promise<Session> {
  return apiFetch<Session>('/v1/anamnesis/sessions', {
    method: 'POST',
    body: JSON.stringify({
      templateId,
      subjectId: options?.subjectId,
      patientId: options?.patientId,
    }),
  });
}

export async function submitAnswers(
  sessionId: string,
  answersJson: Record<string, unknown>
): Promise<{
  id: string;
  sessionId: string;
  answersJson: Record<string, unknown>;
  createdAt: string;
}> {
  return apiFetch(`/v1/anamnesis/sessions/${sessionId}/answers`, {
    method: 'POST',
    body: JSON.stringify({ answersJson }),
  });
}

export async function signSession(
  sessionId: string,
  body: { signerName: string; agreed: true }
): Promise<Session> {
  return apiFetch<Session>(`/v1/anamnesis/sessions/${sessionId}/sign`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getFillLink(sessionId: string): Promise<{ fillToken: string; fillUrl: string }> {
  return apiFetch<{ fillToken: string; fillUrl: string }>(
    `/v1/anamnesis/sessions/${sessionId}/fill-link`,
    { method: 'POST' }
  );
}

export async function exportSession(
  sessionId: string,
  format: 'json' | 'pdf'
): Promise<void> {
  const url = `/v1/anamnesis/sessions/${sessionId}/export?format=${format}`;
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantId) headers['x-tenant-id'] = tenantId;

  const API_URL = import.meta.env.VITE_API_URL || '';
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;
  const res = await fetch(fullUrl, { headers });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? err.message ?? `Erro ${res.status}`);
  }

  if (format === 'json') {
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `anamnese-${sessionId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  } else {
    const html = await res.text();
    const blob = new Blob([html], { type: 'text/html' });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `anamnese-${sessionId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    window.open(downloadUrl, '_blank');
  }
}
