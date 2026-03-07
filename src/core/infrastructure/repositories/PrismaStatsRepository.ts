import type { PrismaClient } from '@prisma/client';
import type {
  IStatsRepository,
  DashboardStatsOpts,
  DashboardStatsResult,
  TemplateReportOpts,
  TemplateReportResult,
  AnalyticsDashboardOpts,
  AnalyticsDashboardResult,
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

  async getAnalyticsDashboard(
    tenantId: string,
    opts: AnalyticsDashboardOpts
  ): Promise<AnalyticsDashboardResult> {
    const periodDays = Math.min(365, Math.max(7, opts.periodDays));
    const toDate = new Date();
    const fromDate = new Date(toDate.getTime() - periodDays * 24 * 60 * 60 * 1000);
    const prevTo = new Date(fromDate.getTime());
    const prevFrom = new Date(prevTo.getTime() - periodDays * 24 * 60 * 60 * 1000);

    const fourteenDaysAgo = new Date(toDate.getTime() - 14 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(toDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const patients = await this.prisma.patient.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, createdAt: true },
    });
    const totalPatients = patients.length;
    const patientIds = patients.map((p) => p.id);

    if (patientIds.length === 0) {
      return {
        period: { from: fromDate.toISOString(), to: toDate.toISOString(), days: periodDays },
        activeStudents: 0,
        inactiveStudents: 0,
        churnRiskStudents: 0,
        averageTrainingAdherence: 0,
        averageDietAdherence: 0,
        newPatientsThisPeriod: 0,
        sessionsCompletedThisPeriod: 0,
        goalsAchievedThisPeriod: 0,
        trendVsPrevious: { activeStudentsDelta: 0, sessionsDelta: 0, adherenceDelta: 0 },
      };
    }

    const [
      sessionsCompletedCurrent,
      sessionsCompletedPrevious,
      executionsCurrent,
      executionsPrevious,
      evolutionsCurrent,
      evolutionsPrevious,
      newPatientsCount,
      goalsAchievedCount,
      activePlans,
      dietPlansWithTarget,
      dietEntriesCurrent,
      lastSessionByPatient,
      lastExecutionByPatient,
      lastEvolutionByPatient,
    ] = await Promise.all([
      this.prisma.anamnesisSession.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: 'completed',
          createdAt: { gte: fromDate, lte: toDate },
          patientId: { in: patientIds },
        },
        select: { patientId: true },
      }),
      this.prisma.anamnesisSession.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: 'completed',
          createdAt: { gte: prevFrom, lt: prevTo },
          patientId: { in: patientIds },
        },
        select: { patientId: true },
      }),
      this.prisma.trainingExecution.findMany({
        where: {
          tenantId,
          patientId: { in: patientIds },
          deletedAt: null,
          completed: true,
          executedAt: { gte: fromDate, lte: toDate },
        },
        select: { patientId: true, executedAt: true },
      }),
      this.prisma.trainingExecution.findMany({
        where: {
          tenantId,
          patientId: { in: patientIds },
          deletedAt: null,
          completed: true,
          executedAt: { gte: prevFrom, lte: prevTo },
        },
        select: { patientId: true },
      }),
      this.prisma.patientEvolution.findMany({
        where: {
          tenantId,
          patientId: { in: patientIds },
          recordedAt: { gte: fromDate, lte: toDate },
        },
        select: { patientId: true },
      }),
      this.prisma.patientEvolution.findMany({
        where: {
          tenantId,
          patientId: { in: patientIds },
          recordedAt: { gte: prevFrom, lte: prevTo },
        },
        select: { patientId: true },
      }),
      this.prisma.patient.count({
        where: { tenantId, deletedAt: null, createdAt: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.patientGoal.count({
        where: { tenantId, achievedAt: { gte: fromDate, lte: toDate } },
      }),
      this.prisma.trainingPlan.findMany({
        where: { patientId: { in: patientIds }, tenantId, deletedAt: null, active: true },
        select: { patientId: true, planJson: true },
      }),
      this.prisma.dietPlan.findMany({
        where: { patientId: { in: patientIds }, tenantId, active: true, deletedAt: null },
        select: { patientId: true, caloriesKcal: true },
      }),
      this.prisma.dietEntry.findMany({
        where: {
          patientId: { in: patientIds },
          tenantId,
          deletedAt: null,
          entryDate: { gte: fromDate, lte: toDate },
        },
        select: { patientId: true, totalCalories: true },
      }),
      this.prisma.anamnesisSession.findMany({
        where: {
          tenantId,
          deletedAt: null,
          status: 'completed',
          patientId: { in: patientIds },
        },
        select: { patientId: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.trainingExecution.findMany({
        where: { tenantId, patientId: { in: patientIds }, deletedAt: null, completed: true },
        select: { patientId: true, executedAt: true },
        orderBy: { executedAt: 'desc' },
      }),
      this.prisma.patientEvolution.findMany({
        where: { tenantId, patientId: { in: patientIds } },
        select: { patientId: true, recordedAt: true },
        orderBy: { recordedAt: 'desc' },
      }),
    ]);

    const activePatientIdsCurrent = new Set<string>();
    for (const s of sessionsCompletedCurrent) {
      if (s.patientId) activePatientIdsCurrent.add(s.patientId);
    }
    for (const e of executionsCurrent) {
      activePatientIdsCurrent.add(e.patientId);
    }
    for (const e of evolutionsCurrent) {
      activePatientIdsCurrent.add(e.patientId);
    }
    const activeStudents = activePatientIdsCurrent.size;

    const activePatientIdsPrevious = new Set<string>();
    for (const s of sessionsCompletedPrevious) {
      if (s.patientId) activePatientIdsPrevious.add(s.patientId);
    }
    for (const e of executionsPrevious) {
      activePatientIdsPrevious.add(e.patientId);
    }
    for (const e of evolutionsPrevious) {
      activePatientIdsPrevious.add(e.patientId);
    }

    const lastActivityByPatient = new Map<string, Date>();
    for (const s of lastSessionByPatient) {
      if (s.patientId) {
        const current = lastActivityByPatient.get(s.patientId);
        if (!current || s.createdAt > current) lastActivityByPatient.set(s.patientId, s.createdAt);
      }
    }
    for (const e of lastExecutionByPatient) {
      const current = lastActivityByPatient.get(e.patientId);
      if (!current || e.executedAt > current) lastActivityByPatient.set(e.patientId, e.executedAt);
    }
    for (const e of lastEvolutionByPatient) {
      const current = lastActivityByPatient.get(e.patientId);
      if (!current || e.recordedAt > current) lastActivityByPatient.set(e.patientId, e.recordedAt);
    }
    let churnRiskStudents = 0;
    for (const [, last] of lastActivityByPatient) {
      if (last >= thirtyDaysAgo && last < fourteenDaysAgo) churnRiskStudents++;
    }

    function getPlannedDaysPerWeek(planJson: unknown): number {
      if (!planJson || typeof planJson !== 'object') return 0;
      const obj = planJson as Record<string, unknown>;
      const days = obj.days;
      if (Array.isArray(days)) return Math.min(7, days.length);
      return 0;
    }

    const weeksInPeriod = periodDays / 7;
    const execCountByPatient = new Map<string, number>();
    for (const e of executionsCurrent) {
      execCountByPatient.set(e.patientId, (execCountByPatient.get(e.patientId) ?? 0) + 1);
    }
    const adherenceByPatient: number[] = [];
    for (const plan of activePlans) {
      const planned = getPlannedDaysPerWeek(plan.planJson) || 5;
      const expected = planned * weeksInPeriod;
      if (expected <= 0) continue;
      const count = execCountByPatient.get(plan.patientId) ?? 0;
      const pct = Math.min(100, Math.round((count / expected) * 100));
      adherenceByPatient.push(pct);
    }
    const averageTrainingAdherence =
      adherenceByPatient.length > 0
        ? Math.round(
            adherenceByPatient.reduce((a, b) => a + b, 0) / adherenceByPatient.length
          )
        : 0;

    const dietTargetByPatient = new Map<string, number>();
    for (const p of dietPlansWithTarget) {
      if (p.caloriesKcal && p.caloriesKcal > 0) dietTargetByPatient.set(p.patientId, p.caloriesKcal);
    }
    const dietCaloriesByPatient = new Map<string, number[]>();
    for (const e of dietEntriesCurrent) {
      const list = dietCaloriesByPatient.get(e.patientId) ?? [];
      list.push(e.totalCalories ?? 0);
      dietCaloriesByPatient.set(e.patientId, list);
    }
    const dietAdherenceList: number[] = [];
    for (const [pid, target] of dietTargetByPatient) {
      const cals = dietCaloriesByPatient.get(pid) ?? [];
      if (cals.length === 0) continue;
      const avg = cals.reduce((a, b) => a + b, 0) / cals.length;
      const pct = Math.min(100, Math.round((avg / target) * 100));
      dietAdherenceList.push(pct);
    }
    const averageDietAdherence =
      dietAdherenceList.length > 0
        ? Math.round(
            dietAdherenceList.reduce((a, b) => a + b, 0) / dietAdherenceList.length
          )
        : 0;

    const execPrevByPatient = new Map<string, number>();
    for (const e of executionsPrevious) {
      execPrevByPatient.set(e.patientId, (execPrevByPatient.get(e.patientId) ?? 0) + 1);
    }
    const prevAdherenceList: number[] = [];
    for (const plan of activePlans) {
      const planned = getPlannedDaysPerWeek(plan.planJson) || 5;
      const expected = planned * weeksInPeriod;
      if (expected <= 0) continue;
      const count = execPrevByPatient.get(plan.patientId) ?? 0;
      prevAdherenceList.push(Math.min(100, Math.round((count / expected) * 100)));
    }
    const prevAdherence =
      prevAdherenceList.length > 0
        ? prevAdherenceList.reduce((a, b) => a + b, 0) / prevAdherenceList.length
        : 0;

    const prevSessionsCount = sessionsCompletedPrevious.length;
    const prevActive = activePatientIdsPrevious.size;
    const activeStudentsDelta =
      prevActive > 0 ? Math.round(((activeStudents - prevActive) / prevActive) * 100) : 0;
    const sessionsDelta =
      prevSessionsCount > 0
        ? Math.round(
            ((sessionsCompletedCurrent.length - prevSessionsCount) / prevSessionsCount) * 100
          )
        : 0;
    const adherenceDelta = Math.round(averageTrainingAdherence - prevAdherence);

    return {
      period: { from: fromDate.toISOString(), to: toDate.toISOString(), days: periodDays },
      activeStudents,
      inactiveStudents: Math.max(0, totalPatients - activeStudents),
      churnRiskStudents,
      averageTrainingAdherence,
      averageDietAdherence,
      newPatientsThisPeriod: newPatientsCount,
      sessionsCompletedThisPeriod: sessionsCompletedCurrent.length,
      goalsAchievedThisPeriod: goalsAchievedCount,
      trendVsPrevious: {
        activeStudentsDelta,
        sessionsDelta,
        adherenceDelta,
      },
    };
  }
}
