import type { FastifyRequest } from 'fastify';
declare module 'fastify' {
    interface FastifyRequest {
        tenantId?: string;
    }
}
export declare function requireTenant(request: FastifyRequest): string;
declare const _default: any;
export default _default;
//# sourceMappingURL=tenant.d.ts.map