import type {
  TemplateSchemaJson,
  QuestionSchema,
  AiInsightPayload,
  RisksPayload,
} from '@shared/types/index.js';
import {
  clamp,
  scoreNumber,
  scoreSingle,
  defaultRiskAggregations,
  defaultRecommendationRules,
  defaultFallbackRecommendation,
  type RiskAggregation,
  type RecommendationRule,
} from './rules.js';
import { createLlmProvider, ExternalAiError } from './llm-provider.js';

/* ── Generic rule-based engine ───────────────────────────────────────── */

interface TagScore {
  scores: number[];
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

function scoreQuestion(q: QuestionSchema, value: unknown): number | null {
  if (q.type === 'number') {
    return scoreNumber(value);
  }
  if (q.type === 'single') {
    return scoreSingle(value, q.options);
  }
  return null;
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
      // Weight later scores more (recency bias)
      const weights = scores.map((_, i) => i + 1);
      const totalWeight = weights.reduce((a, b) => a + b, 0);
      return scores.reduce((acc, s, i) => acc + s * weights[i], 0) / totalWeight;
    }
  }
}

function computeRisks(
  tagMap: Map<string, TagScore>,
  aggregations: RiskAggregation[]
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

function buildRecommendations(risks: RisksPayload, rules: RecommendationRule[]): string[] {
  const recs: string[] = [];
  for (const rule of rules) {
    if (rule.condition(risks)) {
      recs.push(rule.recommendation);
    }
  }
  if (recs.length === 0) recs.push(defaultFallbackRecommendation);
  return recs;
}

/**
 * Generic rule-based insights: iterates all template questions,
 * scores by type, aggregates by tag, produces risks/summary/recommendations.
 */
export function generateInsightsRuleBased(
  template: TemplateSchemaJson,
  answers: Record<string, unknown>
): AiInsightPayload {
  const tagMap = collectScores(template, answers);
  const risks = computeRisks(tagMap, defaultRiskAggregations);
  const summary = buildSummary(risks);
  const recommendations = buildRecommendations(risks, defaultRecommendationRules);

  return { summary, risks, recommendations };
}

/* ── LLM mock (unchanged) ───────────────────────────────────────────── */

export function generateInsightsLlmMock(
  _template: TemplateSchemaJson,
  answers: Record<string, unknown>
): AiInsightPayload {
  const seed = JSON.stringify(answers)
    .split('')
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const rng = (): number => {
    const x = Math.sin(seed * 9999 + 1) * 10000;
    return x - Math.floor(x);
  };

  const summaries = [
    'Análise inicial indica perfil compatível com o programa.',
    'Alguns pontos de atenção foram identificados para acompanhamento.',
    'Respostas sugerem boa adesão potencial com suporte adequado.',
  ];
  const summary = summaries[Math.floor(rng() * summaries.length)];

  const risks: RisksPayload = {
    readiness: clamp(40 + rng() * 50),
    dropoutRisk: clamp(20 + rng() * 40),
    stress: clamp(30 + rng() * 50),
    sleepQuality: clamp(35 + rng() * 55),
  };

  const recs = [
    'Manter comunicação regular com a equipe.',
    'Estabelecer metas semanais pequenas e alcançáveis.',
    'Registrar dúvidas e progressos no app.',
  ];
  const n = 1 + Math.floor(rng() * 2);
  const recommendations = recs.sort(() => rng() - 0.5).slice(0, n);

  return { summary, risks, recommendations };
}

/* ── Main dispatcher with fallback support ──────────────────────────── */

export async function generateInsights(
  mode: 'ruleBased' | 'llmMock' | 'llm',
  template: TemplateSchemaJson,
  answers: Record<string, unknown>,
  llmConfig?: {
    provider?: string;
    apiKey?: string;
    model?: string;
    fallbackProvider?: string;
    fallbackApiKey?: string;
    fallbackModel?: string;
    customPrompt?: string | null;
  }
): Promise<AiInsightPayload & { usage?: { inputTokens: number; outputTokens: number } }> {
  if (mode === 'llm') {
    const primaryProvider = createLlmProvider({
      provider: llmConfig?.provider,
      apiKey: llmConfig?.apiKey,
      model: llmConfig?.model,
    });

    try {
      return await primaryProvider.generateInsights(template, answers, llmConfig?.customPrompt);
    } catch (err) {
      // If primary fails and fallback is configured, try fallback
      if (
        err instanceof ExternalAiError &&
        llmConfig?.fallbackProvider &&
        llmConfig?.fallbackApiKey
      ) {
        const fallbackProvider = createLlmProvider({
          provider: llmConfig.fallbackProvider,
          apiKey: llmConfig.fallbackApiKey,
          model: llmConfig.fallbackModel,
        });
        return await fallbackProvider.generateInsights(template, answers, llmConfig.customPrompt);
      }
      throw err;
    }
  }
  if (mode === 'llmMock') return generateInsightsLlmMock(template, answers);
  return generateInsightsRuleBased(template, answers);
}
