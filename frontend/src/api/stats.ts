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

export interface StudentOverviewItem {
  patientId: string;
  fullName: string;
  training7d: string;
  diet7d: string;
  attention: string;
  attentionSeverity: 'high' | 'medium' | 'low' | 'none';
}

export interface StudentsOverviewResponse {
  students: StudentOverviewItem[];
}

export async function getStudentsOverview(): Promise<StudentsOverviewResponse> {
  return apiFetch<StudentsOverviewResponse>('/v1/stats/students-overview');
}

export interface AnalyticsDashboard {
  period: { from: string; to: string; days: number };
  activeStudents: number;
  inactiveStudents: number;
  churnRiskStudents: number;
  averageTrainingAdherence: number;
  averageDietAdherence: number;
  newPatientsThisPeriod: number;
  sessionsCompletedThisPeriod: number;
  goalsAchievedThisPeriod: number;
  trendVsPrevious: {
    activeStudentsDelta: number;
    sessionsDelta: number;
    adherenceDelta: number;
  };
}

export async function getAnalyticsDashboard(days?: number): Promise<AnalyticsDashboard> {
  const qs = days != null ? `?days=${days}` : '';
  return apiFetch<AnalyticsDashboard>(`/v1/stats/analytics${qs}`);
}
