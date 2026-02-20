import type { AnamnesisSession } from '@domain/entities/AnamnesisSession.js';
import type { AnamnesisTemplate } from '@domain/entities/AnamnesisTemplate.js';

export interface InsightData {
  summary: string;
  risks: { readiness: number; dropoutRisk: number; stress: number; sleepQuality: number };
  recommendations: string[];
  usage?: { inputTokens: number; outputTokens: number };
}

/**
 * Port: generates AI insight payload from session answers and template schema
 */
export interface IInsightGenerator {
  generate(session: AnamnesisSession, template: AnamnesisTemplate): Promise<InsightData>;
}
