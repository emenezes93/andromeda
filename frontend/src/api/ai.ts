import { apiFetch } from './client';
import type { AiInsight } from '@/types';

export interface AiUsageMetrics {
  period: {
    from: string | null;
    to: string | null;
  };
  totals: {
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCostUsd: number;
  };
  records: Array<{
    id: string;
    sessionId: string;
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    estimatedCostUsd: number;
    createdAt: string;
  }>;
}

export interface AiUsageParams {
  from?: string;
  to?: string;
}

export async function getAiUsage(params?: AiUsageParams): Promise<AiUsageMetrics> {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  const qs = search.toString();
  return apiFetch<AiUsageMetrics>(`/v1/ai/usage${qs ? `?${qs}` : ''}`);
}

export async function getInsights(sessionId: string): Promise<AiInsight> {
  return apiFetch<AiInsight>(`/v1/ai/insights/${sessionId}`);
}

export async function generateInsights(sessionId: string): Promise<AiInsight> {
  return apiFetch<AiInsight>('/v1/ai/insights', {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}
