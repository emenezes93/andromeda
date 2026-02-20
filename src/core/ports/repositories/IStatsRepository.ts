/**
 * Port: aggregation queries for dashboard and template stats
 */
export interface DashboardStatsOpts {
  from?: string;
  to?: string;
  days?: number;
  pendingDays?: number;
  highRiskThreshold?: number;
}

export interface DashboardStatsResult {
  period: { from: string; to: string };
  totals: { sessions: number; completed: number; templates: number };
  alerts: {
    pendingQuestionnairesCount: number;
    pendingQuestionnaires: Array<{
      sessionId: string;
      patientId: string | null;
      patientName: string | null;
      templateName: string;
      createdAt: string;
      daysPending: number;
    }>;
    highRiskCount: number;
    highRiskList: Array<{
      sessionId: string;
      patientId: string | null;
      patientName: string | null;
      dropoutRisk: number;
      insightCreatedAt: string;
    }>;
  };
  byDay: Record<string, number>;
  byTemplate: Array<{ templateId: string; templateName: string; count: number }>;
}

export interface TemplateReportOpts {
  from?: string;
  to?: string;
  days?: number;
}

export interface TemplateReportResult {
  template: { id: string; name: string };
  period: { from: string; to: string };
  metrics: {
    totalSessions: number;
    completedSessions: number;
    completionRate: number;
    avgDurationMinutes: number | null;
  };
  sessions: Array<{ id: string; status: string; createdAt: string }>;
}

export interface IStatsRepository {
  getDashboard(tenantId: string, opts: DashboardStatsOpts): Promise<DashboardStatsResult>;
  getTemplateReport(
    tenantId: string,
    templateId: string,
    opts: TemplateReportOpts
  ): Promise<TemplateReportResult>;
}
