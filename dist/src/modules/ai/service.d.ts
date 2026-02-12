import type { TemplateSchemaJson, AiInsightPayload } from '../../shared/types/index.js';
/**
 * Rule-based strategy: derive summary, risks (0-100), and recommendations from answers.
 */
export declare function generateInsightsRuleBased(template: TemplateSchemaJson, answers: Record<string, unknown>): AiInsightPayload;
/**
 * LLM mock: deterministic varied text using seed from answers (no external API).
 */
export declare function generateInsightsLlmMock(_template: TemplateSchemaJson, answers: Record<string, unknown>): AiInsightPayload;
export declare function generateInsights(mode: 'ruleBased' | 'llmMock', template: TemplateSchemaJson, answers: Record<string, unknown>): AiInsightPayload;
//# sourceMappingURL=service.d.ts.map