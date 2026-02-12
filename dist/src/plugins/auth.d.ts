import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { AuthUser } from '../shared/types/index.js';
declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthUser;
    }
}
export interface AuthPluginOptions {
    secret: string;
    skipPaths?: string[];
}
declare function authPlugin(fastify: FastifyInstance, opts: AuthPluginOptions): Promise<void>;
export declare function requireAuth(request: FastifyRequest): AuthUser;
declare const _default: typeof authPlugin;
export default _default;
//# sourceMappingURL=auth.d.ts.map