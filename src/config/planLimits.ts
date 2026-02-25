export type PlanTier = 'free' | 'solo' | 'clinic' | 'pro';

export interface PlanLimits {
  maxPatients: number | null;
  maxSessionsPerMonth: number | null;
  aiInsightsEnabled: boolean;
}

export const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free:   { maxPatients: 3,    maxSessionsPerMonth: 10,   aiInsightsEnabled: false },
  solo:   { maxPatients: 50,   maxSessionsPerMonth: null, aiInsightsEnabled: true  },
  clinic: { maxPatients: 300,  maxSessionsPerMonth: null, aiInsightsEnabled: true  },
  pro:    { maxPatients: null, maxSessionsPerMonth: null,  aiInsightsEnabled: true  },
};

export function getLimits(tier: string): PlanLimits {
  return PLAN_LIMITS[(tier as PlanTier)] ?? PLAN_LIMITS.free;
}
