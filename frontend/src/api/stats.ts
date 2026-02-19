import { apiFetch } from './client';

export interface DashboardStats {
  period: {
    from: string;
    to: string;
  };
  totals: {
    sessions: number;
    completed: number;
    templates: number;
  };
  byDay: Record<string, number>;
  byTemplate: Array<{
    templateId: string;
    templateName: string;
    count: number;
  }>;
}

export interface TemplateReport {
  template: {
    id: string;
    name: string;
  };
  period: {
    from: string;
    to: string;
  };
  metrics: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    avgDurationMinutes: number | null;
  };
  sessions: Array<{
    id: string;
    status: string;
    createdAt: string;
  }>;
}

export interface DashboardStatsParams {
  from?: string;
  to?: string;
  days?: number;
}

export async function getDashboardStats(
  params?: DashboardStatsParams
): Promise<DashboardStats> {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  if (params?.days) search.set('days', String(params.days));
  const qs = search.toString();
  return apiFetch<DashboardStats>(`/v1/stats/dashboard${qs ? `?${qs}` : ''}`);
}

export async function getTemplateReport(
  templateId: string,
  params?: DashboardStatsParams
): Promise<TemplateReport> {
  const search = new URLSearchParams();
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  if (params?.days) search.set('days', String(params.days));
  const qs = search.toString();
  return apiFetch<TemplateReport>(`/v1/stats/templates/${templateId}${qs ? `?${qs}` : ''}`);
}
