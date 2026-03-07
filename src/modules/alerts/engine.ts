import type { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

const ALERT_TYPES = {
  inactive: 'inactive',
  adherence_drop: 'adherence_drop',
  streak_broken: 'streak_broken',
  goal_due_soon: 'goal_due_soon',
  goal_achieved: 'goal_achieved',
  dropout_risk: 'dropout_risk',
  no_recent_assessment: 'no_recent_assessment',
} as const;

type AlertType = (typeof ALERT_TYPES)[keyof typeof ALERT_TYPES];
type Severity = 'high' | 'medium' | 'low' | 'info';

function getPlannedDaysFromPlanJson(planJson: unknown): number {
  if (!planJson || typeof planJson !== 'object') return 0;
  const obj = planJson as Record<string, unknown>;
  const days = obj.days;
  if (Array.isArray(days)) return days.length;
  return 0;
}

function getLastNBusinessDays(n: number): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  let count = 0;
  for (let i = 0; count < n && i < 14; i++) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) {
      out.push(new Date(d));
      count++;
    }
    d.setDate(d.getDate() - 1);
  }
  return out;
}

/**
 * Run alert rules for all tenants and create Alert records.
 * Call once per day (e.g. 08:00). Dedupes: does not create same type for same patient if unread exists from today.
 */
export async function runAlertEngine(prisma: PrismaClient): Promise<{ created: number }> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const sixtyDaysAgo = new Date(now);
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  const fiveDaysAgo = new Date(now);
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
  const threeBusinessDays = getLastNBusinessDays(3);
  const fourteenDaysFromNow = new Date(now);
  fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

  const tenants = await prisma.tenant.findMany({
    where: { deletedAt: null, status: 'active' },
    select: { id: true },
  });

  let created = 0;

  for (const tenant of tenants) {
    const tenantId = tenant.id;
    const patients = await prisma.patient.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, fullName: true },
    });
    if (patients.length === 0) continue;

    const patientIds = patients.map((p) => p.id);

    const [
      executionsLast7d,
      executionsPrev7d,
      executionsLast5d,
      activePlans,
      _dietEntriesLast7d,
      activeDietPlans,
      goals,
      evolutions,
      lastSessionPerPatient,
      existingAlertsToday,
    ] = await Promise.all([
      prisma.trainingExecution.findMany({
        where: {
          patientId: { in: patientIds },
          tenantId,
          deletedAt: null,
          completed: true,
          executedAt: { gte: sevenDaysAgo },
        },
        select: { patientId: true, executedAt: true },
      }),
      prisma.trainingExecution.findMany({
        where: {
          patientId: { in: patientIds },
          tenantId,
          deletedAt: null,
          completed: true,
          executedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
        select: { patientId: true },
      }),
      prisma.trainingExecution.findMany({
        where: {
          patientId: { in: patientIds },
          tenantId,
          deletedAt: null,
          completed: true,
          executedAt: { gte: fiveDaysAgo },
        },
        select: { patientId: true, executedAt: true },
      }),
      prisma.trainingPlan.findMany({
        where: { patientId: { in: patientIds }, tenantId, deletedAt: null, active: true },
        select: { patientId: true, planJson: true },
        orderBy: { startDate: 'desc' },
      }),
      prisma.dietEntry.findMany({
        where: {
          patientId: { in: patientIds },
          tenantId,
          deletedAt: null,
          entryDate: { gte: sevenDaysAgo },
        },
        select: { patientId: true, entryDate: true },
      }),
      prisma.dietPlan.findMany({
        where: { patientId: { in: patientIds }, tenantId, active: true, deletedAt: null },
        select: { patientId: true },
      }),
      prisma.patientGoal.findMany({
        where: { patientId: { in: patientIds }, tenantId, deletedAt: null },
        select: { patientId: true, title: true, targetValue: true, unit: true, achievedAt: true, targetDate: true },
      }),
      prisma.patientEvolution.findMany({
        where: { patientId: { in: patientIds }, tenantId },
        orderBy: { recordedAt: 'desc' },
        select: { patientId: true, weightKg: true, bodyFatPercent: true },
      }),
      (async () => {
        const sessions = await prisma.anamnesisSession.findMany({
          where: { patientId: { in: patientIds }, tenantId, status: 'completed', deletedAt: null },
          orderBy: { createdAt: 'desc' },
          select: { id: true, patientId: true, createdAt: true },
        });
        const byPatient = new Map<string, { id: string; createdAt: Date }>();
        for (const s of sessions) {
          if (s.patientId && !byPatient.has(s.patientId)) {
            byPatient.set(s.patientId, { id: s.id, createdAt: s.createdAt });
          }
        }
        return byPatient;
      })(),
      prisma.alert.findMany({
        where: { tenantId, createdAt: { gte: todayStart }, readAt: null },
        select: { patientId: true, type: true },
      }),
    ]);

    const plannedByPatient = new Map<string, number>();
    for (const plan of activePlans) {
      if (!plannedByPatient.has(plan.patientId)) {
        plannedByPatient.set(plan.patientId, getPlannedDaysFromPlanJson(plan.planJson) || 5);
      }
    }
    const execCountThis = new Map<string, number>();
    const execCountPrev = new Map<string, number>();
    const execDatesLast5d = new Map<string, Set<string>>();
    for (const e of executionsLast7d) {
      execCountThis.set(e.patientId, (execCountThis.get(e.patientId) ?? 0) + 1);
    }
    for (const e of executionsPrev7d) {
      execCountPrev.set(e.patientId, (execCountPrev.get(e.patientId) ?? 0) + 1);
    }
    for (const e of executionsLast5d) {
      const key = e.executedAt.toISOString().split('T')[0];
      const set = execDatesLast5d.get(e.patientId) ?? new Set();
      set.add(key);
      execDatesLast5d.set(e.patientId, set);
    }
    const businessDayKeys = new Set(threeBusinessDays.map((d) => d.toISOString().split('T')[0]));

    const dietEntryDaysByPatient = new Map<string, Set<string>>();
    const dietEntriesLast30d = await prisma.dietEntry.findMany({
      where: {
        patientId: { in: patientIds },
        tenantId,
        deletedAt: null,
        entryDate: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { patientId: true, entryDate: true },
    });
    for (const e of dietEntriesLast30d) {
      const key = e.entryDate.toISOString().split('T')[0];
      const set = dietEntryDaysByPatient.get(e.patientId) ?? new Set();
      set.add(key);
      dietEntryDaysByPatient.set(e.patientId, set);
    }
    const lastSessionByPatient = new Map<string, Date>();
    const sessionIdsForInsight: string[] = [];
    for (const [patientId, v] of lastSessionPerPatient) {
      lastSessionByPatient.set(patientId, v.createdAt);
      sessionIdsForInsight.push(v.id);
    }
    const insights =
      sessionIdsForInsight.length > 0
        ? await prisma.aiInsight.findMany({
            where: { sessionId: { in: sessionIdsForInsight } },
            select: { sessionId: true, risksJson: true },
          })
        : [];
    const sessionToPatient = new Map<string, string>();
    for (const [patientId, v] of lastSessionPerPatient) {
      sessionToPatient.set(v.id, patientId);
    }
    const dropoutByPatient = new Map<string, number>();
    for (const i of insights) {
      const patientId = sessionToPatient.get(i.sessionId);
      if (!patientId) continue;
      const risks = i.risksJson as Record<string, number> | null;
      const dropout = risks?.dropoutRisk;
      if (typeof dropout === 'number') {
        dropoutByPatient.set(patientId, dropout);
      }
    }

    const goalDueSoon = new Map<string, { title: string }>();
    const goalAchieved = new Map<string, { title: string }>();
    for (const g of goals) {
      if (g.achievedAt) {
        goalAchieved.set(g.patientId, { title: g.title });
      } else {
        const target = new Date(g.targetDate);
        if (target >= now && target <= fourteenDaysFromNow) {
          goalDueSoon.set(g.patientId, { title: g.title });
        }
      }
    }
    const lastEvolutionByPatient = new Map<string, { weightKg: number | null; bodyFatPercent: number | null }>();
    for (const e of evolutions) {
      if (!lastEvolutionByPatient.has(e.patientId)) {
        lastEvolutionByPatient.set(e.patientId, {
          weightKg: e.weightKg,
          bodyFatPercent: e.bodyFatPercent,
        });
      }
    }

    const existingSet = new Set(existingAlertsToday.map((a) => `${a.patientId}:${a.type}`));

    async function maybeCreate(
      patientId: string,
      type: AlertType,
      severity: Severity,
      message: string,
      metadata?: Record<string, unknown>
    ): Promise<void> {
      const key = `${patientId}:${type}`;
      if (existingSet.has(key)) return;
      await prisma.alert.create({
        data: {
          tenantId,
          patientId,
          type,
          severity,
          message,
          metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
        },
      });
      existingSet.add(key);
      created++;
    }

    for (const p of patients) {
      const planned = plannedByPatient.get(p.id) ?? 0;
      const countThis = execCountThis.get(p.id) ?? 0;
      const countPrev = execCountPrev.get(p.id) ?? 0;
      const adherenceThis = planned > 0 ? Math.min(100, Math.round((countThis / planned) * 100)) : 0;
      const adherencePrev = planned > 0 ? Math.min(100, Math.round((countPrev / planned) * 100)) : 0;
      const drop = adherencePrev - adherenceThis;
      const execDates = execDatesLast5d.get(p.id);
      const hasExecInLast3Business =
        execDates && [...execDates].some((k) => businessDayKeys.has(k));
      const dietDays = dietEntryDaysByPatient.get(p.id);
      const dietStreak = dietDays
        ? (() => {
            let s = 0;
            const d = new Date();
            d.setHours(0, 0, 0, 0);
            for (let i = 0; i < 365; i++) {
              const key = d.toISOString().split('T')[0];
              if (dietDays.has(key)) s++;
              else if (i > 0) break;
              d.setDate(d.getDate() - 1);
            }
            return s;
          })()
        : 0;
      const dietStreakUntilYesterday = dietDays
        ? (() => {
            let s = 0;
            const d = new Date();
            d.setDate(d.getDate() - 1);
            d.setHours(0, 0, 0, 0);
            for (let i = 0; i < 365; i++) {
              const key = d.toISOString().split('T')[0];
              if (dietDays.has(key)) s++;
              else if (i > 0) break;
              d.setDate(d.getDate() - 1);
            }
            return s;
          })()
        : 0;
      const lastSession = lastSessionByPatient.get(p.id);
      const noRecentAssessment = !lastSession || lastSession < sixtyDaysAgo;
      const dropoutRisk = dropoutByPatient.get(p.id) ?? 0;
      const goalDue = goalDueSoon.get(p.id);
      const goalAch = goalAchieved.get(p.id);

      if (!hasExecInLast3Business && planned > 0) {
        await maybeCreate(
          p.id,
          ALERT_TYPES.inactive,
          'high',
          `${p.fullName}: sem treino nos últimos 3 dias úteis.`
        );
      }
      if (drop > 25) {
        await maybeCreate(
          p.id,
          ALERT_TYPES.adherence_drop,
          'medium',
          `${p.fullName}: aderência ao treino caiu ${drop}% em relação à semana anterior.`
        );
      }
      if (dietStreak === 0 && dietStreakUntilYesterday >= 7) {
        const hadPlan = activeDietPlans.some((dp) => dp.patientId === p.id);
        if (hadPlan) {
          await maybeCreate(
            p.id,
            ALERT_TYPES.streak_broken,
            'medium',
            `${p.fullName}: streak de dieta quebrado (era ${dietStreakUntilYesterday} dias).`
          );
        }
      }
      if (goalDue) {
        await maybeCreate(
          p.id,
          ALERT_TYPES.goal_due_soon,
          'medium',
          `${p.fullName}: meta "${goalDue.title}" vence em breve.`,
          { goalTitle: goalDue.title }
        );
      }
      if (goalAch) {
        await maybeCreate(
          p.id,
          ALERT_TYPES.goal_achieved,
          'info',
          `${p.fullName}: meta "${goalAch.title}" atingida!`,
          { goalTitle: goalAch.title }
        );
      }
      if (dropoutRisk >= 70) {
        await maybeCreate(
          p.id,
          ALERT_TYPES.dropout_risk,
          'high',
          `${p.fullName}: risco de dropout alto (${Math.round(dropoutRisk)}%).`
        );
      }
      if (noRecentAssessment) {
        await maybeCreate(
          p.id,
          ALERT_TYPES.no_recent_assessment,
          'low',
          `${p.fullName}: sem avaliação concluída nos últimos 60 dias.`
        );
      }
    }
  }

  return { created };
}
