import type { FastifyInstance, FastifyRequest } from 'fastify';
declare module 'fastify' {
    interface FastifyRequest {
        tenantId?: string;
    }
}
declare function tenantPlugin(fastify: FastifyInstance): Promise<void>;
export declare function requireTenant(request: FastifyRequest): string;
declare const _default: typeof tenantPlugin;
export default _default;
//# sourceMappingURL=tenant.d.ts.map