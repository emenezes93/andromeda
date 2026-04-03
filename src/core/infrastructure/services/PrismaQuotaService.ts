import type { PrismaClient } from '@prisma/client';
import { getLimits } from '@config/planLimits.js';
import type { IQuotaService, QuotaCheckResult, UsageSummary } from '@ports/services/IQuotaService.js';
import { UnprocessableEntityError } from '@shared/errors/index.js';

function effectivePlanTier(tenant: { planTier: string | null; trialEndsAt: Date | null } | null): string {
  if (!tenant) return 'free';
  const now = new Date();
  if (tenant.trialEndsAt && tenant.trialEndsAt > now) return 'trial';
  return tenant.planTier ?? 'free';
}

export class PrismaQuotaService implements IQuotaService {
  constructor(private readonly prisma: PrismaClient) {}

  async checkPatientQuota(tenantId: string): Promise<QuotaCheckResult> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const limits = getLimits(effectivePlanTier(tenant));
    if (limits.maxPatients === null) return { allowed: true, current: 0, max: null };
    const current = await this.prisma.patient.count({
      where: { tenantId, deletedAt: null },
    });
    const allowed = current < limits.maxPatients;
    return {
      allowed,
      current,
      max: limits.maxPatients,
      message: allowed
        ? undefined
        : `Limite de ${limits.maxPatients} pacientes atingido. Faça upgrade do plano para adicionar mais pacientes.`,
    };
  }

  async checkSessionQuota(tenantId: string): Promise<QuotaCheckResult> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const limits = getLimits(effectivePlanTier(tenant));
    if (limits.maxSessionsPerMonth === null) return { allowed: true, current: 0, max: null };
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const current = await this.prisma.anamnesisSession.count({
      where: { tenantId, createdAt: { gte: startOfMonth }, deletedAt: null },
    });
    const allowed = current < limits.maxSessionsPerMonth;
    return {
      allowed,
      current,
      max: limits.maxSessionsPerMonth,
      message: allowed
        ? undefined
        : `Limite de ${limits.maxSessionsPerMonth} sessões por mês atingido. Faça upgrade do plano para continuar.`,
    };
  }

  async checkAiInsightQuota(tenantId: string): Promise<QuotaCheckResult> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const limits = getLimits(effectivePlanTier(tenant));
    if (!limits.aiInsightsEnabled) {
      return {
        allowed: false,
        current: 0,
        max: null,
        message: 'Insights de IA não estão disponíveis no plano gratuito. Faça upgrade para acessar.',
      };
    }
    if (limits.maxAiInsightsPerMonth === null) {
      return { allowed: true, current: 0, max: null };
    }
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const current = await this.prisma.aiInsight.count({
      where: { tenantId, createdAt: { gte: startOfMonth } },
    });
    const allowed = current < limits.maxAiInsightsPerMonth;
    return {
      allowed,
      current,
      max: limits.maxAiInsightsPerMonth,
      message: allowed
        ? undefined
        : `Limite de ${limits.maxAiInsightsPerMonth} insights de IA por mês atingido. Faça upgrade para continuar.`,
    };
  }

  async getUsageSummary(tenantId: string): Promise<UsageSummary> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const planTier = effectivePlanTier(tenant);
    const limits = getLimits(planTier);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [patientCount, sessionCount, insightCount] = await Promise.all([
      this.prisma.patient.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.anamnesisSession.count({
        where: { tenantId, createdAt: { gte: startOfMonth }, deletedAt: null },
      }),
      this.prisma.aiInsight.count({
        where: { tenantId, createdAt: { gte: startOfMonth } },
      }),
    ]);
    return {
      planTier,
      patients: { current: patientCount, max: limits.maxPatients },
      sessionsThisMonth: { current: sessionCount, max: limits.maxSessionsPerMonth },
      aiInsightsEnabled: limits.aiInsightsEnabled,
      aiInsightsThisMonth: { current: insightCount, max: limits.maxAiInsightsPerMonth },
    };
  }
}

export function assertQuota(result: QuotaCheckResult): void {
  if (!result.allowed) {
    throw new UnprocessableEntityError(result.message ?? 'Quota exceeded');
  }
}
