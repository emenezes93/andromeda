import type { Session, SessionListResponse } from '@/types';
import { apiFetch } from './client';

export interface ListSessionsParams {
  page?: number;
  limit?: number;
}

export async function listSessions(params: ListSessionsParams = {}): Promise<SessionListResponse> {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.limit != null) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch<SessionListResponse>(`/v1/anamnesis/sessions${qs ? `?${qs}` : ''}`);
}

export async function getSession(id: string): Promise<Session> {
  return apiFetch<Session>(`/v1/anamnesis/sessions/${id}`);
}

export async function createSession(templateId: string, subjectId?: string): Promise<Session> {
  return apiFetch<Session>('/v1/anamnesis/sessions', {
    method: 'POST',
    body: JSON.stringify({ templateId, subjectId }),
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
