import type { RisksPayload } from '@shared/types/index.js';

/* ── Interfaces ──────────────────────────────────────────────────────── */

export interface ScoringRule {
  tag: string;
  questionTypes: ('number' | 'single')[];
  scoringFn: (value: unknown, questionType: string) => number | null;
}

export interface RiskAggregation {
  riskKey: keyof RisksPayload;
  sourceTags: string[];
  aggregation: 'avg' | 'max' | 'min' | 'weighted';
  defaultScore: number;
}

export interface RecommendationRule {
  condition: (risks: RisksPayload) => boolean;
  recommendation: string;
}

/* ── Helpers ─────────────────────────────────────────────────────────── */

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/**
 * Score a `number` question: normalise value to 0-100.
 * Assumes a 1-10 scale by default unless the question provides `options`
 * with exactly two numeric-parseable entries interpreted as [min, max].
 */
function scoreNumber(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  // Default 1-10 scale → 0-100
  return clamp(((n - 1) / 9) * 100);
}

/**
 * Score a `single` question: map the position of the selected option
 * inside `options[]` to 0-100 linearly.
 */
function scoreSingle(
  value: unknown,
  options: string[] | undefined
): number | null {
  if (!options || options.length === 0) return null;
  const idx = options.indexOf(String(value));
  if (idx === -1) return null;
  if (options.length === 1) return 50;
  return clamp((idx / (options.length - 1)) * 100);
}

/* ── Default rules ───────────────────────────────────────────────────── */

export const defaultScoringRules: ScoringRule[] = [
  {
    tag: '*',
    questionTypes: ['number', 'single'],
    scoringFn: (value: unknown, questionType: string) => {
      if (questionType === 'number') return scoreNumber(value);
      // `single` scoring needs options — handled in the engine, not here
      return null;
    },
  },
];

export const defaultRiskAggregations: RiskAggregation[] = [
  { riskKey: 'stress', sourceTags: ['stress'], aggregation: 'avg', defaultScore: 50 },
  { riskKey: 'sleepQuality', sourceTags: ['sleep'], aggregation: 'avg', defaultScore: 50 },
  { riskKey: 'readiness', sourceTags: ['readiness', 'exercise', 'physical_activity'], aggregation: 'avg', defaultScore: 50 },
  { riskKey: 'dropoutRisk', sourceTags: ['food_emotional', 'dropout'], aggregation: 'avg', defaultScore: 30 },
];

export const defaultRecommendationRules: RecommendationRule[] = [
  {
    condition: (r) => r.stress > 60,
    recommendation: 'Considerar técnicas de manejo de estresse e respiração.',
  },
  {
    condition: (r) => r.sleepQuality < 50,
    recommendation: 'Priorizar higiene do sono e horários regulares.',
  },
  {
    condition: (r) => r.dropoutRisk > 50,
    recommendation: 'Acompanhamento mais frequente pode aumentar adesão.',
  },
];

export const defaultFallbackRecommendation = 'Manter hábitos atuais e acompanhar evolução.';

/* ── Generic scoring engine ──────────────────────────────────────────── */

export { clamp, scoreNumber, scoreSingle };
