export type PlanTier = 'free' | 'trial' | 'solo' | 'clinic' | 'pro';

export interface PlanLimits {
  maxPatients: number | null;
  maxSessionsPerMonth: number | null;
  aiInsightsEnabled: boolean;
  /** Maximum AI insights per month (null = unlimited) */
  maxAiInsightsPerMonth: number | null;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free:   { maxPatients: 3,    maxSessionsPerMonth: 10,   aiInsightsEnabled: false, maxAiInsightsPerMonth: null },
  trial:  { maxPatients: 5,    maxSessionsPerMonth: 20,   aiInsightsEnabled: true,  maxAiInsightsPerMonth: 5    },
  solo:   { maxPatients: 50,   maxSessionsPerMonth: null, aiInsightsEnabled: true,  maxAiInsightsPerMonth: null },
  clinic: { maxPatients: 300,  maxSessionsPerMonth: null, aiInsightsEnabled: true,  maxAiInsightsPerMonth: null },
  pro:    { maxPatients: null, maxSessionsPerMonth: null,  aiInsightsEnabled: true,  maxAiInsightsPerMonth: null },
};

export function getLimits(tier: string): PlanLimits {
  return PLAN_LIMITS[(tier as PlanTier)] ?? PLAN_LIMITS.free;
}
