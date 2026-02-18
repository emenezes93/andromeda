import type { NextQuestionResponse } from '@/types';
import { apiFetch } from './client';

export async function getNextQuestion(
  sessionId: string,
  currentAnswers: Record<string, unknown>
): Promise<NextQuestionResponse> {
  return apiFetch<NextQuestionResponse>('/v1/anamnesis/engine/next-question', {
    method: 'POST',
    body: JSON.stringify({ sessionId, currentAnswers }),
  });
}
