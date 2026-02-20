/**
 * Adapter: Redis cache for insight by answers hash. Falls back to no-op if Redis unavailable.
 */
import type { IInsightCache, CachedInsightData } from '@ports/services/IInsightCache.js';

type RedisLike = {
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<string>;
};

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const KEY_PREFIX = 'ai:insight:';

export class RedisInsightCache implements IInsightCache {
  private client: RedisLike | null = null;
  private available = false;
  private initPromise: Promise<void> | null = null;

  constructor(getClient: () => Promise<RedisLike | null>) {
    this.initPromise = getClient().then((c) => {
      this.client = c;
      this.available = c != null;
    });
  }

  private async ensureInit(): Promise<void> {
    if (this.initPromise) await this.initPromise;
  }

  async get(tenantId: string, answersHash: string): Promise<CachedInsightData | null> {
    await this.ensureInit();
    if (!this.available || !this.client) return null;
    try {
      const raw = await this.client.get(`${KEY_PREFIX}${tenantId}:${answersHash}`);
      if (!raw) return null;
      return JSON.parse(raw) as CachedInsightData;
    } catch {
      return null;
    }
  }

  async set(
    tenantId: string,
    answersHash: string,
    value: CachedInsightData,
    ttlSeconds: number = CACHE_TTL_SECONDS
  ): Promise<void> {
    await this.ensureInit();
    if (!this.available || !this.client) return;
    try {
      await this.client.setex(
        `${KEY_PREFIX}${tenantId}:${answersHash}`,
        ttlSeconds,
        JSON.stringify(value)
      );
    } catch {
      // ignore
    }
  }
}

/**
 * Factory: create Redis cache if redisUrl and ioredis are available.
 * Synchronous — connection is established lazily inside RedisInsightCache constructor.
 */
export function createRedisInsightCache(redisUrl: string): RedisInsightCache {
  const getClient = async (): Promise<RedisLike | null> => {
    let mod: { default?: new (u: string) => RedisLike } | null = null;
    try {
      mod = (await import('ioredis')) as { default?: new (u: string) => RedisLike };
    } catch {
      return null;
    }
    if (!mod?.default) return null;
    try {
      const Redis = mod.default;
      const client = new Redis(redisUrl) as RedisLike;
      await (client as { ping?: () => Promise<string> }).ping?.();
      return client;
    } catch {
      return null;
    }
  };
  return new RedisInsightCache(getClient);
}
