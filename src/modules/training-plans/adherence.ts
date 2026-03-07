import type { PrismaClient } from '@prisma/client';

function getPlannedDaysFromPlanJson(planJson: unknown): number {
  if (!planJson || typeof planJson !== 'object') return 0;
  const obj = planJson as Record<string, unknown>;
  const days = obj.days;
  if (Array.isArray(days)) return days.length;
  return 0;
}

export interface TrainingAdherenceResult {
  executionsCount: number;
  plannedDays: number;
  adherencePercent: number;
}

/**
 * Aderência = execuções completed no período / (dias do plano * semanas no período).
 * Período em dias; "semanas" = dias / 7. plannedDays vem do planJson.days.
 */
export async function calculateTrainingAdherence(
  prisma: PrismaClient,
  planId: string,
  tenantId: string,
  from: Date,
  to: Date
): Promise<TrainingAdherenceResult> {
  const plan = await prisma.trainingPlan.findFirst({
    where: { id: planId, tenantId, deletedAt: null },
    select: { planJson: true },
  });
  const plannedDays = plan ? getPlannedDaysFromPlanJson(plan.planJson) : 0;
  const fallbackPlanned = plannedDays > 0 ? plannedDays : 5;

  const executions = await prisma.trainingExecution.findMany({
    where: {
      trainingPlanId: planId,
      tenantId,
      deletedAt: null,
      completed: true,
      executedAt: { gte: from, lte: to },
    },
    select: { id: true },
  });

  const daysInPeriod = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)));
  const weeksInPeriod = daysInPeriod / 7;
  const expectedExecutions = Math.round(fallbackPlanned * weeksInPeriod);
  const adherencePercent =
    expectedExecutions > 0
      ? Math.min(100, Math.round((executions.length / expectedExecutions) * 100))
      : 0;

  return {
    executionsCount: executions.length,
    plannedDays: fallbackPlanned,
    adherencePercent,
  };
}
