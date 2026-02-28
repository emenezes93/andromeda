import { apiFetch } from './client';
import type {
  ScheduledQuestionnaire,
  ScheduledQuestionnaireListResponse,
  CreateScheduledQuestionnaireBody,
} from '@/types';

export interface ListScheduledQuestionnairesParams {
  page?: number;
  limit?: number;
  patientId?: string;
  templateId?: string;
  active?: boolean;
}

export async function listScheduledQuestionnaires(
  params?: ListScheduledQuestionnairesParams,
): Promise<ScheduledQuestionnaireListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.patientId) search.set('patientId', params.patientId);
  if (params?.templateId) search.set('templateId', params.templateId);
  if (params?.active != null) search.set('active', String(params.active));
  const qs = search.toString();
  return apiFetch<ScheduledQuestionnaireListResponse>(
    `/v1/scheduled-questionnaires${qs ? `?${qs}` : ''}`,
  );
}

export async function createScheduledQuestionnaire(
  body: CreateScheduledQuestionnaireBody,
): Promise<ScheduledQuestionnaire> {
  return apiFetch<ScheduledQuestionnaire>('/v1/scheduled-questionnaires', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateScheduledQuestionnaire(
  id: string,
  body: Partial<CreateScheduledQuestionnaireBody> & { active?: boolean },
): Promise<ScheduledQuestionnaire> {
  return apiFetch<ScheduledQuestionnaire>(`/v1/scheduled-questionnaires/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function deleteScheduledQuestionnaire(id: string): Promise<void> {
  return apiFetch<void>(`/v1/scheduled-questionnaires/${id}`, { method: 'DELETE' });
}
