import { apiFetch } from './client';
import type { QuestionSchema } from '@/types';

const PUBLIC_OPTS = { skipAuth: true as const };

export interface PublicFillData {
  sessionId: string;
  status: string;
  templateName: string;
  schema: { questions?: QuestionSchema[]; conditionalLogic?: unknown };
  currentAnswers: Record<string, unknown>;
}

export interface NextQuestionResponse {
  nextQuestion: QuestionSchema | null;
  reason: string;
  completionPercent: number;
}

export async function getPublicFillData(token: string): Promise<PublicFillData> {
  return apiFetch<PublicFillData>(`/v1/public/fill/${token}`, { method: 'GET', ...PUBLIC_OPTS });
}

export async function postPublicNextQuestion(
  token: string,
  answersJson: Record<string, unknown>
): Promise<NextQuestionResponse> {
  return apiFetch<NextQuestionResponse>(`/v1/public/fill/${token}/next-question`, {
    method: 'POST',
    body: JSON.stringify({ answersJson }),
    ...PUBLIC_OPTS,
  });
}

export async function postPublicAnswers(
  token: string,
  answersJson: Record<string, unknown>
): Promise<{ completed: boolean }> {
  return apiFetch<{ completed: boolean }>(`/v1/public/fill/${token}/answers`, {
    method: 'POST',
    body: JSON.stringify({ answersJson }),
    ...PUBLIC_OPTS,
  });
}

export async function postPublicSign(
  token: string,
  body: { signerName: string; agreed: true }
): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>(`/v1/public/fill/${token}/sign`, {
    method: 'POST',
    body: JSON.stringify(body),
    ...PUBLIC_OPTS,
  });
}
