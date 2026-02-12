import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { env } from './plugins/env.js';
import prismaPlugin from './plugins/prisma.js';
import tenantPlugin from './plugins/tenant.js';
import authPlugin from './plugins/auth.js';
import rateLimitPlugin from './plugins/rateLimit.js';
import swaggerPlugin from './plugins/swagger.js';
import errorHandlerPlugin from './plugins/errorHandler.js';
import { registerSchemas } from './schemas/index.js';
import { healthRoutes } from './modules/health/routes.js';
// Legacy routes - sendo migrados para arquitetura hexagonal
import { tenantsRoutes } from './modules/tenants/routes.js';
import { usersRoutes } from './modules/users/routes.js';
import { templatesRoutes } from './modules/anamnesis/templates/routes.js';
import { sessionsRoutes } from './modules/anamnesis/sessions/routes.js';
import { engineRoutes } from './modules/anamnesis/engine/routes.js';
import { aiRoutes } from './modules/ai/routes.js';
import { auditRoutes } from './modules/audit/routes.js';
// New hexagonal architecture
import { Container } from './infrastructure/di/Container.js';
export async function buildApp() {
    const app = Fastify({
        logger: { level: env.NODE_ENV === 'production' ? 'info' : 'debug' },
        requestIdHeader: 'x-request-id',
        requestIdLogLabel: 'requestId',
        bodyLimit: env.BODY_LIMIT,
        connectionTimeout: env.REQUEST_TIMEOUT,
        keepAliveTimeout: env.REQUEST_TIMEOUT,
    });
    await app.register(helmet, { contentSecurityPolicy: false });
    const corsOrigin = env.CORS_ORIGINS === '*' ? true : env.CORS_ORIGINS.split(',').map((o) => o.trim());
    await app.register(cors, { origin: corsOrigin, credentials: true });
    registerSchemas(app);
    await app.register(prismaPlugin);
    await app.register(tenantPlugin);
    await app.register(authPlugin, {
        secret: env.JWT_SECRET,
        skipPaths: ['/health', '/ready', '/v1/auth/login', '/v1/auth/refresh', '/v1/auth/logout', '/documentation', '/documentation/json'],
    });
    await app.register(rateLimitPlugin, {
        global: env.RATE_LIMIT_GLOBAL,
        auth: env.RATE_LIMIT_AUTH,
    });
    await app.register(swaggerPlugin);
    await app.register(errorHandlerPlugin);
    // Dependency Injection Container
    const container = new Container(app.prisma);
    // Health routes (no auth required)
    await app.register(healthRoutes);
    // Auth routes (hexagonal architecture)
    container.authController.registerRoutes(app);
    // Legacy routes (migrating progressively to hexagonal)
    await app.register(tenantsRoutes);
    await app.register(usersRoutes);
    await app.register(templatesRoutes, { prefix: '' });
    await app.register(sessionsRoutes, { prefix: '' });
    await app.register(engineRoutes, { prefix: '' });
    await app.register(aiRoutes);
    await app.register(auditRoutes);
    return app;
}
//# sourceMappingURL=app.js.map