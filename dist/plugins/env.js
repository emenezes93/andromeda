import { z } from 'zod';
import dotenv from 'dotenv';
dotenv.config();
const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.coerce.number().default(3000),
    HOST: z.string().default('0.0.0.0'),
    DATABASE_URL: z.string().min(1),
    JWT_SECRET: z.string().min(32),
    RATE_LIMIT_GLOBAL: z.coerce.number().default(60),
    RATE_LIMIT_AUTH: z.coerce.number().default(10),
    RATE_LIMIT_TEMPLATES: z.coerce.number().default(30),
    RATE_LIMIT_SESSIONS: z.coerce.number().default(30),
    RATE_LIMIT_AI: z.coerce.number().default(10),
    BODY_LIMIT: z.coerce.number().default(1048576),
    REQUEST_TIMEOUT: z.coerce.number().default(30000),
    AI_MODE: z.enum(['ruleBased', 'llmMock']).default('ruleBased'),
    CORS_ORIGINS: z.string().default('*'),
});
function loadEnv() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
        console.error('Invalid environment:', parsed.error.flatten());
        throw new Error('Invalid environment configuration');
    }
    return parsed.data;
}
export const env = loadEnv();
//# sourceMappingURL=env.js.map