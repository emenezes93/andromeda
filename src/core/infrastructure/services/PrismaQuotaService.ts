import type { PrismaClient } from '@prisma/client';
import { getLimits } from '@config/planLimits.js';
import type { IQuotaService, QuotaCheckResult, UsageSummary } from '@ports/services/IQuotaService.js';
import { ForbiddenError } from '@shared/errors/index.js';

export class PrismaQuotaService implements IQuotaService {
  constructor(private readonly prisma: PrismaClient) {}

  async checkPatientQuota(tenantId: string): Promise<QuotaCheckResult> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const limits = getLimits(tenant?.planTier ?? 'free');
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
    const limits = getLimits(tenant?.planTier ?? 'free');
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
    const limits = getLimits(tenant?.planTier ?? 'free');
    return {
      allowed: limits.aiInsightsEnabled,
      current: 0,
      max: null,
      message: limits.aiInsightsEnabled
        ? undefined
        : 'Insights de IA não estão disponíveis no plano gratuito. Faça upgrade para acessar.',
    };
  }

  async getUsageSummary(tenantId: string): Promise<UsageSummary> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const planTier = tenant?.planTier ?? 'free';
    const limits = getLimits(planTier);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [patientCount, sessionCount] = await Promise.all([
      this.prisma.patient.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.anamnesisSession.count({
        where: { tenantId, createdAt: { gte: startOfMonth }, deletedAt: null },
      }),
    ]);
    return {
      planTier,
      patients: { current: patientCount, max: limits.maxPatients },
      sessionsThisMonth: { current: sessionCount, max: limits.maxSessionsPerMonth },
      aiInsightsEnabled: limits.aiInsightsEnabled,
    };
  }
}

export function assertQuota(result: QuotaCheckResult): void {
  if (!result.allowed) {
    throw new ForbiddenError(result.message ?? 'Quota exceeded');
  }
}
