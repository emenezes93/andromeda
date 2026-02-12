import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../shared/errors/index.js';
async function authPlugin(fastify, opts) {
    const { secret, skipPaths = ['/health', '/ready', '/v1/auth/login', '/documentation', '/documentation/json'] } = opts;
    fastify.decorateRequest('user', undefined);
    fastify.addHook('preHandler', async (request, _reply) => {
        const path = request.routerPath ?? request.url.split('?')[0];
        if (skipPaths.some((p) => path === p || path.startsWith(p + '/'))) {
            return;
        }
        const authHeader = request.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new UnauthorizedError('Missing or invalid Authorization header');
        }
        const token = authHeader.slice(7);
        try {
            const payload = jwt.verify(token, secret);
            request.user = {
                userId: payload.userId,
                email: payload.email,
                role: payload.role,
                tenantId: payload.tenantId,
            };
        }
        catch {
            throw new UnauthorizedError('Invalid or expired token');
        }
    });
}
export function requireAuth(request) {
    if (!request.user)
        throw new UnauthorizedError('Authentication required');
    return request.user;
}
export default fp(authPlugin, { name: 'auth' });
//# sourceMappingURL=auth.js.map