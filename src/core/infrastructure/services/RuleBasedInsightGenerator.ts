import type { AnamnesisSession } from '@domain/entities/AnamnesisSession.js';
import type { AnamnesisTemplate } from '@domain/entities/AnamnesisTemplate.js';
import type { IInsightGenerator, InsightData } from '@ports/services/IInsightGenerator.js';
import type { TemplateSchemaJson, QuestionSchema, RisksPayload } from '@shared/types/index.js';

interface TagScore {
  scores: number[];
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function scoreNumber(value: unknown): number | null {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return clamp(((n - 1) / 9) * 100);
}

function scoreSingle(value: unknown, options: string[] | undefined): number | null {
  if (!options || options.length === 0) return null;
  const idx = options.indexOf(String(value));
  if (idx === -1) return null;
  if (options.length === 1) return 50;
  return clamp((idx / (options.length - 1)) * 100);
}

function scoreQuestion(q: QuestionSchema, value: unknown): number | null {
  if (q.type === 'number') return scoreNumber(value);
  if (q.type === 'single') return scoreSingle(value, q.options);
  return null;
}

function collectScores(
  template: TemplateSchemaJson,
  answers: Record<string, unknown>
): Map<string, TagScore> {
  const tagMap = new Map<string, TagScore>();
  for (const q of template.questions) {
    const value = answers[q.id];
    if (value === undefined || value === '') continue;
    const tags = q.tags && q.tags.length > 0 ? q.tags : [];
    if (tags.length === 0) continue;
    const score = scoreQuestion(q, value);
    if (score === null) continue;
    for (const tag of tags) {
      let entry = tagMap.get(tag);
      if (!entry) {
        entry = { scores: [] };
        tagMap.set(tag, entry);
      }
      entry.scores.push(score);
    }
  }
  return tagMap;
}

function aggregateScores(
  scores: number[],
  aggregation: 'avg' | 'max' | 'min' | 'weighted'
): number {
  if (scores.length === 0) return 0;
  switch (aggregation) {
    case 'avg':
      return scores.reduce((a, b) => a + b, 0) / scores.length;
    case 'max':
      return Math.max(...scores);
    case 'min':
      return Math.min(...scores);
    case 'weighted': {
      const weights = scores.map((_, i) => i + 1);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      return scores.reduce((acc, s, i) => acc + s * weights[i], 0) / totalWeight;
    }
  }
}

const defaultRiskAggregations: Array<{
  riskKey: keyof RisksPayload;
  sourceTags: string[];
  aggregation: 'avg' | 'max' | 'min' | 'weighted';
  defaultScore: number;
}> = [
  { riskKey: 'stress', sourceTags: ['stress'], aggregation: 'avg', defaultScore: 50 },
  { riskKey: 'sleepQuality', sourceTags: ['sleep'], aggregation: 'avg', defaultScore: 50 },
  {
    riskKey: 'readiness',
    sourceTags: ['readiness', 'exercise', 'physical_activity'],
    aggregation: 'avg',
    defaultScore: 50,
  },
  {
    riskKey: 'dropoutRisk',
    sourceTags: ['food_emotional', 'dropout'],
    aggregation: 'avg',
    defaultScore: 30,
  },
];

function computeRisks(
  tagMap: Map<string, TagScore>,
  aggregations: typeof defaultRiskAggregations
): RisksPayload {
  const risks: RisksPayload = { readiness: 50, dropoutRisk: 30, stress: 50, sleepQuality: 50 };
  for (const agg of aggregations) {
    const allScores: number[] = [];
    for (const tag of agg.sourceTags) {
      const entry = tagMap.get(tag);
      if (entry) allScores.push(...entry.scores);
    }
    if (allScores.length > 0) {
      risks[agg.riskKey] = clamp(aggregateScores(allScores, agg.aggregation));
    } else {
      risks[agg.riskKey] = agg.defaultScore;
    }
  }
  return risks;
}

function buildSummary(risks: RisksPayload): string {
  const parts: string[] = [];
  if (risks.stress > 70) parts.push('Nível de estresse elevado identificado.');
  if (risks.sleepQuality < 50) parts.push('Qualidade de sono pode ser melhorada.');
  if (risks.readiness >= 60) parts.push('Disposição para mudança positiva.');
  if (parts.length === 0) parts.push('Perfil inicial registrado com sucesso.');
  return parts.join(' ');
}

const defaultRecommendationRules: Array<{ condition: (r: RisksPayload) => boolean; recommendation: string }> = [
  { condition: (r) => r.stress > 60, recommendation: 'Considerar técnicas de manejo de estresse e respiração.' },
  { condition: (r) => r.sleepQuality < 50, recommendation: 'Priorizar higiene do sono e horários regulares.' },
  { condition: (r) => r.dropoutRisk > 50, recommendation: 'Acompanhamento mais frequente pode aumentar adesão.' },
];
const defaultFallbackRecommendation = 'Manter hábitos atuais e acompanhar evolução.';

function buildRecommendations(risks: RisksPayload): string[] {
  const recs: string[] = [];
  for (const rule of defaultRecommendationRules) {
    if (rule.condition(risks)) recs.push(rule.recommendation);
  }
  if (recs.length === 0) recs.push(defaultFallbackRecommendation);
  return recs;
}

export class RuleBasedInsightGenerator implements IInsightGenerator {
  async generate(session: AnamnesisSession, template: AnamnesisTemplate): Promise<InsightData> {
    const schema = template.schemaJson as TemplateSchemaJson;
    const questions = schema?.questions ?? [];
    const answers = session.currentAnswersJson ?? {};
    const tagMap = collectScores({ questions }, answers);
    const risks = computeRisks(tagMap, defaultRiskAggregations);
    const summary = buildSummary(risks);
    const recommendations = buildRecommendations(risks);
    return { summary, risks, recommendations };
  }
}
