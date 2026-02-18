import type { AiInsight } from '@/types';
import { apiFetch } from './client';

export async function generateInsights(sessionId: string): Promise<AiInsight> {
  return apiFetch<AiInsight>('/v1/ai/insights', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}

export async function getInsights(sessionId: string): Promise<AiInsight> {
  return apiFetch<AiInsight>(`/v1/ai/insights/${sessionId}`);
}
