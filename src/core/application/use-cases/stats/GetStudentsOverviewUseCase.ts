import type { PrismaClient } from '@prisma/client';

export interface GetStudentsOverviewRequest {
  tenantId: string;
}

export interface StudentOverviewItem {
  patientId: string;
  fullName: string;
  training7d: string;
  diet7d: string;
  attention: string;
  attentionSeverity: 'high' | 'medium' | 'low' | 'none';
}

export interface GetStudentsOverviewResponse {
  students: StudentOverviewItem[];
}

function getPlannedDaysFromPlanJson(planJson: unknown): number {
  if (!planJson || typeof planJson !== 'object') return 0;
  const obj = planJson as Record<string, unknown>;
  const days = obj.days;
  if (Array.isArray(days)) return days.length;
  return 0;
}

/**
 * Business days in the last N calendar days: count days that are not weekend.
 * Used to detect "no training in last 3 business days".
 */
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

export class GetStudentsOverviewUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(request: GetStudentsOverviewRequest): Promise<GetStudentsOverviewResponse> {
    const { tenantId } = request;

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const threeBusinessDaysAgo = getLastNBusinessDays(3);

    const patients = await this.prisma.patient.findMany({
      where: { tenantId, deletedAt: null },
      select: { id: true, fullName: true },
      orderBy: { fullName: 'asc' },
    });

    if (patients.length === 0) {
      return { students: [] };
    }

    const patientIds = patients.map((p) => p.id);

    const fiveDaysAgo = new Date(now);
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const [
      executionsLast7d,
      executionsPrev7d,
      executionsLast5d,
      activePlans,
      dietEntriesLast7d,
      activeDietPlans,
      goals,
    ] = await Promise.all([
      this.prisma.trainingExecution.findMany({
        where: {
          patientId: { in: patientIds },
          tenantId,
          deletedAt: null,
          completed: true,
          executedAt: { gte: sevenDaysAgo },
        },
        select: { patientId: true, executedAt: true },
      }),
      this.prisma.trainingExecution.findMany({
        where: {
          patientId: { in: patientIds },
          tenantId,
          deletedAt: null,
          completed: true,
          executedAt: { gte: fourteenDaysAgo, lt: sevenDaysAgo },
        },
        select: { patientId: true },
      }),
      this.prisma.trainingExecution.findMany({
        where: {
          patientId: { in: patientIds },
          tenantId,
          deletedAt: null,
          completed: true,
          executedAt: { gte: fiveDaysAgo },
        },
        select: { patientId: true, executedAt: true },
      }),
      this.prisma.trainingPlan.findMany({
        where: { patientId: { in: patientIds }, tenantId, deletedAt: null, active: true },
        select: { patientId: true, planJson: true },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.dietEntry.findMany({
        where: {
          patientId: { in: patientIds },
          tenantId,
          deletedAt: null,
          entryDate: { gte: sevenDaysAgo },
        },
        select: { patientId: true, entryDate: true, totalCalories: true },
      }),
      this.prisma.dietPlan.findMany({
        where: { patientId: { in: patientIds }, tenantId, active: true, deletedAt: null },
        select: { patientId: true, caloriesKcal: true },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.patientGoal.findMany({
        where: { patientId: { in: patientIds }, tenantId, deletedAt: null },
        select: { patientId: true, targetDate: true, achievedAt: true, title: true },
      }),
    ]);

    const plannedDaysByPatient = new Map<string, number>();
    const planByPatient = new Map<string, { planJson: unknown }>();
    for (const plan of activePlans) {
      if (!plannedDaysByPatient.has(plan.patientId)) {
        const days = getPlannedDaysFromPlanJson(plan.planJson) || 5;
        plannedDaysByPatient.set(plan.patientId, days);
        planByPatient.set(plan.patientId, { planJson: plan.planJson });
      }
    }

    const execCountThisWeek = new Map<string, number>();
    const execCountPrevWeek = new Map<string, number>();
    const lastExecByPatient = new Map<string, Date>();
    const execDatesLast5dByPatient = new Map<string, Set<string>>();
    for (const e of executionsLast7d) {
      execCountThisWeek.set(e.patientId, (execCountThisWeek.get(e.patientId) ?? 0) + 1);
      const last = lastExecByPatient.get(e.patientId);
      if (!last || e.executedAt > last) lastExecByPatient.set(e.patientId, e.executedAt);
    }
    for (const e of executionsPrev7d) {
      execCountPrevWeek.set(e.patientId, (execCountPrevWeek.get(e.patientId) ?? 0) + 1);
    }
    for (const e of executionsLast5d) {
      const key = e.executedAt.toISOString().split('T')[0];
      const set = execDatesLast5dByPatient.get(e.patientId) ?? new Set();
      set.add(key);
      execDatesLast5dByPatient.set(e.patientId, set);
    }

    const dietEntriesByPatient = new Map<string, { entryDate: Date; totalCalories: number | null }[]>();
    for (const e of dietEntriesLast7d) {
      const list = dietEntriesByPatient.get(e.patientId) ?? [];
      list.push({ entryDate: e.entryDate, totalCalories: e.totalCalories });
      dietEntriesByPatient.set(e.patientId, list);
    }
    const dietPlanByPatient = new Map<string, number>();
    for (const p of activeDietPlans) {
      if (!dietPlanByPatient.has(p.patientId) && p.caloriesKcal) {
        dietPlanByPatient.set(p.patientId, p.caloriesKcal);
      }
    }

    const goalDueSoonByPatient = new Set<string>();
    const fourteenDaysFromNow = new Date(now);
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
    for (const g of goals) {
      if (g.achievedAt) continue;
      const target = new Date(g.targetDate);
      if (target >= now && target <= fourteenDaysFromNow) {
        goalDueSoonByPatient.add(g.patientId);
      }
    }

    const students: StudentOverviewItem[] = patients.map((p) => {
      const planned = plannedDaysByPatient.get(p.id) ?? 5;
      const countThis = execCountThisWeek.get(p.id) ?? 0;
      const countPrev = execCountPrevWeek.get(p.id) ?? 0;
      const adherenceThis = planned > 0 ? Math.min(100, Math.round((countThis / planned) * 100)) : 0;
      const adherencePrev = planned > 0 ? Math.min(100, Math.round((countPrev / planned) * 100)) : 0;
      const drop = adherencePrev - adherenceThis;

      const training7dLabel = planned > 0 ? `${countThis}/${planned} (${adherenceThis}%)` : '—';

      let diet7dLabel = '—';
      const dietEntries = dietEntriesByPatient.get(p.id) ?? [];
      const targetCal = dietPlanByPatient.get(p.id);
      if (targetCal && dietEntries.length > 0) {
        const avgCal = dietEntries.reduce((s, e) => s + (e.totalCalories ?? 0), 0) / dietEntries.length;
        const macroPct = Math.min(100, Math.round((avgCal / targetCal) * 100));
        diet7dLabel = `${macroPct}%`;
      }

      let attention = '';
      let attentionSeverity: 'high' | 'medium' | 'low' | 'none' = 'none';

      const execDates = execDatesLast5dByPatient.get(p.id);
      const businessDayKeys = new Set(threeBusinessDaysAgo.map((d) => d.toISOString().split('T')[0]));
      const hasExecInLast3BusinessDays =
        execDates && [...execDates].some((dateKey) => businessDayKeys.has(dateKey));

      if (!hasExecInLast3BusinessDays && planned > 0) {
        attention = '!! Inativo';
        attentionSeverity = 'high';
      } else if (drop > 25) {
        attention = '! Queda';
        attentionSeverity = 'medium';
      } else if (goalDueSoonByPatient.has(p.id)) {
        attention = 'Meta perto';
        attentionSeverity = 'low';
      }

      return {
        patientId: p.id,
        fullName: p.fullName,
        training7d: training7dLabel,
        diet7d: diet7dLabel,
        attention,
        attentionSeverity,
      };
    });

    const severityOrder = { high: 0, medium: 1, low: 2, none: 3 };
    students.sort((a, b) => severityOrder[a.attentionSeverity] - severityOrder[b.attentionSeverity]);

    return { students };
  }
}
