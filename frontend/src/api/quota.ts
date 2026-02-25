import { apiFetch } from './client';
import type { PlanUsageSummary } from '@/types';

export async function getUsageSummary(): Promise<PlanUsageSummary> {
  return apiFetch<PlanUsageSummary>('/v1/quota/usage');
}
