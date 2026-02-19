/**
 * Redis cache for AI insights similarity.
 * Falls back to database if Redis is not available.
 * 
 * Note: ioredis is an optional dependency. If not installed, Redis features are disabled.
 */

import type { PrismaClient } from '@prisma/client';

let redisClient: any = null;
let redisAvailable = false;
let redisInitPromise: Promise<void> | null = null;
let redisModuleChecked = false;

// Lazy initialization of Redis
async function initRedis(): Promise<void> {
  if (redisInitPromise) return redisInitPromise;
  if (redisModuleChecked && !redisAvailable) return;

  redisInitPromise = (async () => {
    redisModuleChecked = true;
    try {
      // Dynamic import with error handling - ioredis is optional
      const redisModule = await import('ioredis').catch(() => null) as {
        default?: new (url: string) => {
          on(event: string, handler: (err?: Error) => void): void;
          ping(): Promise<string>;
          get(key: string): Promise<string | null>;
          setex(key: string, ttl: number, value: string): Promise<string>;
          keys(pattern: string): Promise<string[]>;
          del(...keys: string[]): Promise<number>;
        };
      } | null;
      if (!redisModule || !redisModule.default) {
        redisAvailable = false;
        return;
      }
      const redisUrl = process.env.REDIS_URL;
      if (redisUrl) {
        const Redis = redisModule.default;
        redisClient = new Redis(redisUrl);
        redisClient.on('error', (err: Error) => {
          console.error('Redis error:', err);
          redisAvailable = false;
        });
        redisClient.on('connect', () => {
          redisAvailable = true;
        });
        // Test connection
        await redisClient.ping().catch(() => {
          redisAvailable = false;
        });
      } else {
        redisAvailable = false;
      }
    } catch {
      // Redis not installed or not configured
      redisAvailable = false;
    }
  })();

  return redisInitPromise;
}

const CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export interface CachedInsight {
  sessionId: string;
  summary: string | null;
  risksJson: unknown;
  recommendationsJson: unknown;
}

/**
 * Get cached insight by answers hash.
 * Returns null if not found or Redis unavailable.
 */
export async function getCachedInsight(
  prisma: PrismaClient,
  tenantId: string,
  answersHash: string
): Promise<CachedInsight | null> {
  await initRedis();

  if (redisAvailable && redisClient) {
    try {
      const cached = await redisClient.get(`ai:insight:${tenantId}:${answersHash}`);
      if (cached) {
        return JSON.parse(cached) as CachedInsight;
      }
    } catch (err) {
      console.error('Redis get error:', err);
      // Fall through to database lookup
    }
  }

  // Fallback to database
  const insight = await prisma.aiInsight.findFirst({
    where: {
      tenantId,
      answersHash,
    },
    orderBy: { createdAt: 'desc' },
    select: {
      sessionId: true,
      summary: true,
      risksJson: true,
      recommendationsJson: true,
    },
  });

  if (insight && redisAvailable && redisClient) {
    // Cache for future lookups
    try {
      await redisClient.setex(
        `ai:insight:${tenantId}:${answersHash}`,
        CACHE_TTL_SECONDS,
        JSON.stringify(insight)
      );
    } catch (err) {
      console.error('Redis set error:', err);
    }
  }

  return insight;
}

/**
 * Cache an insight by answers hash.
 */
export async function cacheInsight(
  tenantId: string,
  answersHash: string,
  insight: CachedInsight
): Promise<void> {
  await initRedis();

  if (redisAvailable && redisClient) {
    try {
      await redisClient.setex(
        `ai:insight:${tenantId}:${answersHash}`,
        CACHE_TTL_SECONDS,
        JSON.stringify(insight)
      );
    } catch (err) {
      console.error('Redis cache error:', err);
    }
  }
}

/**
 * Invalidate cache for a tenant (useful when limits change, etc).
 */
export async function invalidateTenantCache(tenantId: string): Promise<void> {
  await initRedis();

  if (redisAvailable && redisClient) {
    try {
      const keys = await redisClient.keys(`ai:insight:${tenantId}:*`);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch (err) {
      console.error('Redis invalidate error:', err);
    }
  }
}
