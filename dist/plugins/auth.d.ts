import type { FastifyRequest } from 'fastify';
import type { AuthUser } from '../shared/types.js';
declare module 'fastify' {
    interface FastifyRequest {
        user?: AuthUser;
    }
}
export interface AuthPluginOptions {
    secret: string;
    skipPaths?: string[];
}
export declare function requireAuth(request: FastifyRequest): AuthUser;
declare const _default: any;
export default _default;
//# sourceMappingURL=auth.d.ts.map