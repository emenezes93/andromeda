import type { Insight } from '@domain/entities/Insight.js';

export interface InsightCreateData {
  tenantId: string;
  sessionId: string;
  summary: string;
  risksJson: Record<string, number>;
  recommendationsJson: string[];
  answersHash?: string | null;
}

/**
 * Port: AI Insight Repository Interface
 */
export interface IInsightRepository {
  findBySessionId(sessionId: string, tenantId: string): Promise<Insight | null>;
  create(data: InsightCreateData): Promise<Insight>;
  /** Find existing insight by tenant + answersHash (for cache reuse). */
  findByAnswersHash(tenantId: string, answersHash: string): Promise<Insight | null>;
}
