import type { IInsightCache, CachedInsightData } from '@ports/services/IInsightCache.js';

/**
 * No-op cache when Redis is not available.
 */
export class NoopInsightCache implements IInsightCache {
  async get(): Promise<CachedInsightData | null> {
    return null;
  }

  async set(_tenantId: string, _answersHash: string, _value: CachedInsightData, _ttlSeconds?: number): Promise<void> {}
}
