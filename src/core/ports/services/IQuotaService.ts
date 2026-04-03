export interface QuotaCheckResult {
  allowed: boolean;
  current: number;
  max: number | null;
  message?: string;
}

export interface UsageSummary {
  planTier: string;
  patients: { current: number; max: number | null };
  sessionsThisMonth: { current: number; max: number | null };
  aiInsightsEnabled: boolean;
  aiInsightsThisMonth: { current: number; max: number | null };
}

export interface IQuotaService {
  checkPatientQuota(tenantId: string): Promise<QuotaCheckResult>;
  checkSessionQuota(tenantId: string): Promise<QuotaCheckResult>;
  checkAiInsightQuota(tenantId: string): Promise<QuotaCheckResult>;
  getUsageSummary(tenantId: string): Promise<UsageSummary>;
}
