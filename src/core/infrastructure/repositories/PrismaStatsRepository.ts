import type { PrismaClient } from '@prisma/client';
import type {
  IStatsRepository,
  DashboardStatsOpts,
  DashboardStatsResult,
  TemplateReportOpts,
  TemplateReportResult,
} from '@ports/repositories/IStatsRepository.js';
import { NotFoundError } from '@shared/errors/index.js';

export class PrismaStatsRepository implements IStatsRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async getDashboard(
    tenantId: string,
    opts: DashboardStatsOpts
  ): Promise<DashboardStatsResult> {
    let fromDate: Date;
    let toDate: Date = new Date();
    const pendingDays = opts.pendingDays ?? 7;
    const highRiskThreshold = opts.highRiskThreshold ?? 70;

    if (opts.days) {
      fromDate = new Date(toDate.getTime() - opts.days * 24 * 60 * 60 * 1000);
    } else if (opts.from) {
      fromDate = new Date(opts.from);
    } else {
      fromDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    if (opts.to) toDate = new Date(opts.to);

    const where = {
      tenantId,
      deletedAt: null,
      createdAt: { gte: fromDate, lte: toDate },
    };
    const pendingCutoff = new Date(
      toDate.getTime() - pendingDays * 24 * 60 * 60 * 1000
    );

    const [
      totalSessions,
      completedSessions,
      totalTemplates,
      sessionsByDay,
      sessionsByTemplate,
      pendingSessions,
      recentInsights,
    ] = await Promise.all([
      this.prisma.anamnesisSession.count({ where }),
      this.prisma.anamnesisSession.count({ where: { ...where, status: 'completed' } }),
      this.prisma.anamnesisTemplate.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.anamnesisSession.groupBy({
        by: ['createdAt'],
        where,
        _count: true,
      }),
      this.prisma.anamnesisSession.groupBy({
        by: ['templateId'],
        where,
        _count: true,
      }),
      this.prisma.anamnesisSession.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: 'in_progress',
          createdAt: { lt: pendingCutoff },
        },
        include: {
          template: { select: { name: true } },
          patient: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'asc' },
        take: 50,
      }),
      this.prisma.aiInsight.findMany({
        where: { tenantId },
        include: {
          session: {
            select: {
              id: true,
              createdAt: true,
              patientId: true,
              patient: { select: { id: true, fullName: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
    ]);

    const templateIds = sessionsByTemplate.map((s) => s.templateId);
    const templates =
      templateIds.length > 0
        ? await this.prisma.anamnesisTemplate.findMany({
            where: { id: { in: templateIds }, tenantId },
            select: { id: true, name: true },
          })
        : [];
    const templateMap = new Map(templates.map((t) => [t.id, t.name]));

    const byDay = sessionsByDay.reduce(
      (acc, item) => {
        const date = item.createdAt.toISOString().slice(0, 10);
        acc[date] = (acc[date] || 0) + item._count;
        return acc;
      },
      {} as Record<string, number>
    );

    const byTemplate = sessionsByTemplate.map((item) => ({
      templateId: item.templateId,
      templateName: templateMap.get(item.templateId) ?? item.templateId.slice(0, 8),
      count: item._count,
    }));

    const pendingQuestionnaires = pendingSessions.map((s) => {
      const daysPending = Math.floor(
        (toDate.getTime() - new Date(s.createdAt).getTime()) /
          (24 * 60 * 60 * 1000)
      );
      return {
        sessionId: s.id,
        patientId: s.patient?.id ?? null,
        patientName: s.patient?.fullName ?? null,
        templateName: s.template.name,
        createdAt: s.createdAt.toISOString(),
        daysPending,
      };
    });

    const highRiskList = recentInsights
      .filter((i) => {
        const r = i.risksJson as { dropoutRisk?: number } | null;
        const risk = typeof r?.dropoutRisk === 'number' ? r.dropoutRisk : 0;
        return risk >= highRiskThreshold;
      })
      .slice(0, 30)
      .map((i) => ({
        sessionId: i.session.id,
        patientId: i.session.patient?.id ?? null,
        patientName: i.session.patient?.fullName ?? null,
        dropoutRisk: typeof (i.risksJson as { dropoutRisk?: unknown })?.dropoutRisk === 'number'
          ? (i.risksJson as { dropoutRisk: number }).dropoutRisk
          : 0,
        insightCreatedAt: i.createdAt.toISOString(),
      }));

    return {
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      totals: {
        sessions: totalSessions,
        completed: completedSessions,
        templates: totalTemplates,
      },
      alerts: {
        pendingQuestionnairesCount: pendingQuestionnaires.length,
        pendingQuestionnaires,
        highRiskCount: highRiskList.length,
        highRiskList,
      },
      byDay,
      byTemplate: byTemplate.sort((a, b) => b.count - a.count),
    };
  }

  async getTemplateReport(
    tenantId: string,
    templateId: string,
    opts: TemplateReportOpts
  ): Promise<TemplateReportResult> {
    const template = await this.prisma.anamnesisTemplate.findFirst({
      where: { id: templateId, tenantId, deletedAt: null },
    });
    if (!template) throw new NotFoundError('Template not found');

    let fromDate: Date;
    let toDate: Date = new Date();

    if (opts.days) {
      fromDate = new Date(toDate.getTime() - opts.days * 24 * 60 * 60 * 1000);
    } else if (opts.from) {
      fromDate = new Date(opts.from);
    } else {
      fromDate = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    if (opts.to) toDate = new Date(opts.to);

    const where = {
      tenantId,
      templateId,
      deletedAt: null,
      createdAt: { gte: fromDate, lte: toDate },
    };

    const [total, completed, sessions] = await Promise.all([
      this.prisma.anamnesisSession.count({ where }),
      this.prisma.anamnesisSession.count({
        where: { ...where, status: 'completed' },
      }),
      this.prisma.anamnesisSession.findMany({
        where,
        select: {
          id: true,
          status: true,
          createdAt: true,
          answers: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const sessionsWithDuration = sessions.map((s) => {
      const firstAnswer = s.answers[0];
      if (!firstAnswer || s.status !== 'completed') return null;
      const durationMs =
        new Date(firstAnswer.createdAt).getTime() - new Date(s.createdAt).getTime();
      return durationMs > 0 ? durationMs : null;
    });
    const validDurations = sessionsWithDuration.filter(
      (d): d is number => d !== null && d > 0
    );
    const avgDurationMs =
      validDurations.length > 0
        ? validDurations.reduce((a, b) => a + b, 0) / validDurations.length
        : null;
    const avgDurationMinutes = avgDurationMs
      ? Math.round(avgDurationMs / (1000 * 60))
      : null;

    return {
      template: { id: template.id, name: template.name },
      period: { from: fromDate.toISOString(), to: toDate.toISOString() },
      metrics: {
        totalSessions: total,
        completedSessions: completed,
        completionRate,
        avgDurationMinutes,
      },
      sessions: sessions.map((s) => ({
        id: s.id,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      })),
    };
  }
}
