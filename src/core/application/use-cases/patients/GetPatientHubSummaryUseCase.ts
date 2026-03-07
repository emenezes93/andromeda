import type { PrismaClient } from '@prisma/client';
import { NotFoundError } from '@shared/errors/index.js';

export interface GetPatientHubSummaryRequest {
  patientId: string;
  tenantId: string;
}

export interface LastInsightRisks {
  readiness?: number;
  dropoutRisk?: number;
  stress?: number;
  sleepQuality?: number;
}

export interface LastEvolutionSummary {
  recordedAt: string;
  weightKg: number | null;
  bodyFatPercent: number | null;
  leanMassKg: number | null;
  bmi: number | null;
}

export interface TrainingSummary7d {
  executionsCount: number;
  plannedDays: number;
  adherencePercent: number;
  lastExecutedAt: string | null;
  averageDurationMinutes: number | null;
}

export interface DietSummary {
  streak: number;
  macroAdherencePercent: number;
  levelLabel: string;
}

export interface HubAlert {
  type: 'goal_due_soon' | 'goal_achieved' | 'inactive' | 'adherence_drop';
  severity: 'high' | 'medium' | 'low' | 'info';
  message: string;
  goalId?: string;
  targetDate?: string;
}

export interface GetPatientHubSummaryResponse {
  patientId: string;
  fullName: string;
  mainGoal: string | null;
  lastInsight: {
    sessionId: string;
    sessionCompletedAt: string;
    risks: LastInsightRisks;
    summary: string | null;
  } | null;
  lastEvolution: LastEvolutionSummary | null;
  training7d: TrainingSummary7d;
  diet: DietSummary;
  alerts: HubAlert[];
  goalsWithOrigin: Array<{
    goalId: string;
    title: string;
    targetValue: number;
    unit: string;
    achievedAt: string | null;
    sessionCompletedAt: string;
  }>;
}

function getPlannedDaysFromPlanJson(planJson: unknown): number {
  if (!planJson || typeof planJson !== 'object') return 0;
  const obj = planJson as Record<string, unknown>;
  const days = obj.days;
  if (Array.isArray(days)) return days.length;
  return 0;
}

export class GetPatientHubSummaryUseCase {
  constructor(private readonly prisma: PrismaClient) {}

  async execute(request: GetPatientHubSummaryRequest): Promise<GetPatientHubSummaryResponse> {
    const { patientId, tenantId } = request;

    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId, deletedAt: null },
    });
    if (!patient) throw new NotFoundError('Patient not found');

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysFromNow = new Date(now);
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);

    const [
      lastCompletedSessionWithInsight,
      lastEvolution,
      executionsLast7d,
      activeTrainingPlans,
      dietEntries,
      activeDietPlan,
      goals,
    ] = await Promise.all([
      this.prisma.anamnesisSession.findFirst({
        where: { patientId, tenantId, status: 'completed', deletedAt: null },
        orderBy: { createdAt: 'desc' },
        include: { aiInsights: { take: 1 } },
      }),
      this.prisma.patientEvolution.findFirst({
        where: { patientId, tenantId },
        orderBy: { recordedAt: 'desc' },
      }),
      this.prisma.trainingExecution.findMany({
        where: {
          patientId,
          tenantId,
          deletedAt: null,
          completed: true,
          executedAt: { gte: sevenDaysAgo },
        },
        orderBy: { executedAt: 'desc' },
      }),
      this.prisma.trainingPlan.findMany({
        where: { patientId, tenantId, deletedAt: null, active: true },
        orderBy: { startDate: 'desc' },
        take: 1,
      }),
      this.prisma.dietEntry.findMany({
        where: { patientId, tenantId, deletedAt: null },
        orderBy: { entryDate: 'desc' },
        take: 365,
        select: { entryDate: true, totalCalories: true },
      }),
      this.prisma.dietPlan.findFirst({
        where: { patientId, tenantId, active: true, deletedAt: null },
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.patientGoal.findMany({
        where: { patientId, tenantId, deletedAt: null },
        include: { basedOnSession: { select: { createdAt: true } } },
      }),
    ]);

    const insight = lastCompletedSessionWithInsight?.aiInsights?.[0];
    const risks = (insight?.risksJson as LastInsightRisks | null) ?? null;

    let plannedDays = 0;
    const plan = activeTrainingPlans[0];
    if (plan?.planJson) {
      plannedDays = getPlannedDaysFromPlanJson(plan.planJson);
    }
    if (plannedDays === 0) plannedDays = 5;
    const adherencePercent =
      plannedDays > 0 ? Math.min(100, Math.round((executionsLast7d.length / plannedDays) * 100)) : 0;
    const lastExec = executionsLast7d[0];
    const sumDuration = executionsLast7d.reduce((s, e) => s + (e.durationMinutes ?? 0), 0);
    const avgDuration =
      executionsLast7d.length > 0 ? Math.round(sumDuration / executionsLast7d.length) : null;

    const entryDays = new Set(dietEntries.map((e) => e.entryDate.toISOString().split('T')[0]));
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (entryDays.has(key)) streak++;
      else if (i > 0) break;
    }

    let macroAdherencePercent = 0;
    if (activeDietPlan?.caloriesKcal && dietEntries.length > 0) {
      const last7 = dietEntries.slice(0, 7);
      const avgCal = last7.reduce((s, e) => s + (e.totalCalories ?? 0), 0) / last7.length;
      macroAdherencePercent = Math.min(100, Math.round((avgCal / activeDietPlan.caloriesKcal) * 100));
    }

    const xpTotal = dietEntries.length * 10 + (streak >= 30 ? 200 : streak >= 7 ? 50 : streak >= 3 ? 15 : 0);
    const levelLabel =
      xpTotal >= 500 ? 'Dedicado' : xpTotal >= 200 ? 'Em progresso' : xpTotal >= 50 ? 'Iniciante' : 'Novato';

    const alerts: HubAlert[] = [];
    const goalsWithOrigin: GetPatientHubSummaryResponse['goalsWithOrigin'] = [];
    for (const g of goals) {
      if (g.achievedAt) {
        alerts.push({
          type: 'goal_achieved',
          severity: 'info',
          message: `Meta "${g.title}" atingida`,
          goalId: g.id,
        });
      } else {
        const target = new Date(g.targetDate);
        if (target <= fourteenDaysFromNow && target >= now) {
          alerts.push({
            type: 'goal_due_soon',
            severity: 'medium',
            message: `Meta "${g.title}" vence em ${Math.ceil((target.getTime() - now.getTime()) / 86400000)} dias`,
            goalId: g.id,
            targetDate: g.targetDate.toISOString().split('T')[0],
          });
        }
      }
      if (g.basedOnSessionId && g.basedOnSession) {
        goalsWithOrigin.push({
          goalId: g.id,
          title: g.title,
          targetValue: g.targetValue,
          unit: g.unit,
          achievedAt: g.achievedAt?.toISOString() ?? null,
          sessionCompletedAt: g.basedOnSession.createdAt.toISOString(),
        });
      }
    }

    const lastEvo = lastEvolution
      ? {
          recordedAt: lastEvolution.recordedAt.toISOString(),
          weightKg: lastEvolution.weightKg,
          bodyFatPercent: lastEvolution.bodyFatPercent,
          leanMassKg:
            lastEvolution.weightKg != null && lastEvolution.bodyFatPercent != null
              ? Math.round(lastEvolution.weightKg * (1 - lastEvolution.bodyFatPercent / 100) * 10) / 10
              : null,
          bmi: lastEvolution.bmi,
        }
      : null;

    return {
      patientId: patient.id,
      fullName: patient.fullName,
      mainGoal: patient.mainGoal,
      lastInsight:
        lastCompletedSessionWithInsight && risks
          ? {
              sessionId: lastCompletedSessionWithInsight.id,
              sessionCompletedAt: lastCompletedSessionWithInsight.createdAt.toISOString(),
              risks,
              summary: (insight?.summary as string) ?? null,
            }
          : null,
      lastEvolution: lastEvo,
      training7d: {
        executionsCount: executionsLast7d.length,
        plannedDays,
        adherencePercent,
        lastExecutedAt: lastExec?.executedAt.toISOString() ?? null,
        averageDurationMinutes: avgDuration,
      },
      diet: {
        streak,
        macroAdherencePercent,
        levelLabel,
      },
      alerts,
      goalsWithOrigin,
    };
  }
}
