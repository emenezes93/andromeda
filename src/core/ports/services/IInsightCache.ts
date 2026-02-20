/**
 * Port: optional cache for insight by answers hash (e.g. Redis).
 */
export interface CachedInsightData {
  sessionId: string;
  summary: string | null;
  risksJson: Record<string, number>;
  recommendationsJson: string[];
}

export interface IInsightCache {
  get(tenantId: string, answersHash: string): Promise<CachedInsightData | null>;
  set(
    tenantId: string,
    answersHash: string,
    value: CachedInsightData,
    ttlSeconds?: number
  ): Promise<void>;
}
