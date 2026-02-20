import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string().min(1),
    /** Optional: sets connection_limit in DATABASE_URL for Prisma connection pool */
    DATABASE_POOL_SIZE: z.coerce.number().int().min(1).max(100).optional(),
    JWT_SECRET: z.string().min(32),
    RATE_LIMIT_GLOBAL: z.coerce.number().default(60),
    RATE_LIMIT_AUTH: z.coerce.number().default(10),
    RATE_LIMIT_TEMPLATES: z.coerce.number().default(30),
    RATE_LIMIT_SESSIONS: z.coerce.number().default(30),
    RATE_LIMIT_AI: z.coerce.number().default(10),
    BODY_LIMIT: z.coerce.number().default(1048576),
    REQUEST_TIMEOUT: z.coerce.number().default(30000),
    AI_MODE: z.enum(['ruleBased', 'llmMock', 'llm']).default('ruleBased'),
    AI_PROVIDER: z.enum(['openai', 'anthropic']).optional(),
    AI_API_KEY: z.string().optional(),
    AI_MODEL: z.string().optional(),
    AI_FALLBACK_PROVIDER: z.enum(['openai', 'anthropic']).optional(),
    AI_FALLBACK_API_KEY: z.string().optional(),
    AI_FALLBACK_MODEL: z.string().optional(),
    REDIS_URL: z.string().url().optional(),
    CORS_ORIGINS: z.string().default('*'),
    // Billing (Stripe) – optional; when set, billing routes are enabled
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_ID: z.string().optional(),
    STRIPE_PRICE_ID_SEMIANNUAL: z.string().optional(),
    STRIPE_PRICE_ID_ANNUAL: z.string().optional(),
    FRONTEND_URL: z.string().url().optional().or(z.literal('')),
  })
  .refine((data) => data.AI_MODE !== 'llm' || (!!data.AI_PROVIDER && !!data.AI_API_KEY), {
    message: 'AI_PROVIDER and AI_API_KEY are required when AI_MODE=llm',
  });

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error('Invalid environment:', parsed.error.flatten());
    throw new Error('Invalid environment configuration');
  }
  return parsed.data;
}

export const env = loadEnv();

// Apply connection pool size to DATABASE_URL before Prisma client is loaded
if (env.DATABASE_POOL_SIZE) {
  try {
    const url = new URL(env.DATABASE_URL);
    url.searchParams.set('connection_limit', String(env.DATABASE_POOL_SIZE));
    process.env.DATABASE_URL = url.toString();
  } catch {
    // DATABASE_URL may be a non-URL format (e.g. postgres://...); leave unchanged
  }
}
