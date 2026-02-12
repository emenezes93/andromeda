import type { FastifyInstance } from 'fastify';
export interface RateLimitOptions {
    global: number;
    auth: number;
}
declare function rateLimitPlugin(fastify: FastifyInstance, opts: RateLimitOptions): Promise<void>;
declare const _default: typeof rateLimitPlugin;
export default _default;
//# sourceMappingURL=rateLimit.d.ts.map