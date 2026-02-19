import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import { env } from '@config/env.js';
import prismaPlugin from '@http/plugins/prisma.js';
import tenantPlugin from '@http/middleware/tenant.js';
import authPlugin from '@http/middleware/auth.js';
import rateLimitPlugin from '@http/middleware/rateLimit.js';
import swaggerPlugin from '@http/plugins/swagger.js';
import errorHandlerPlugin from '@http/middleware/errorHandler.js';
import { registerSchemas } from '../schemas/index.js';
import { healthRoutes } from '../modules/health/routes.js';
// Legacy routes - sendo migrados para arquitetura hexagonal
import { tenantsRoutes } from '../modules/tenants/routes.js';
import { usersRoutes } from '../modules/users/routes.js';
import { templatesRoutes } from '../modules/anamnesis/templates/routes.js';
import { sessionsRoutes } from '../modules/anamnesis/sessions/routes.js';
import { publicFillRoutes } from '../modules/anamnesis/publicFill/routes.js';
import { engineRoutes } from '../modules/anamnesis/engine/routes.js';
import { aiRoutes } from '../modules/ai/routes.js';
import { auditRoutes } from '../modules/audit/routes.js';
import { patientsRoutes } from '../modules/patients/routes.js';
import { billingRoutes } from '../modules/billing/routes.js';
import { statsRoutes } from '../modules/stats/routes.js';
// New hexagonal architecture
import { Container } from '@core/infrastructure/di/Container.js';

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
  const corsOrigin =
    env.CORS_ORIGINS === '*' ? true : env.CORS_ORIGINS.split(',').map((o) => o.trim());
  await app.register(cors, { origin: corsOrigin, credentials: true });
  // Preserve raw body for Stripe webhook signature verification
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (req, body, done) => {
    const buf: Buffer = Buffer.isBuffer(body)
      ? body
      : typeof body === 'string'
        ? Buffer.from(body, 'utf8')
        : Buffer.from(body as Uint8Array);
    (req as unknown as { rawBody?: Buffer }).rawBody = buf;
    try {
      done(null, JSON.parse(buf.toString('utf8')));
    } catch (e) {
      done(e as Error, undefined);
    }
  });
  registerSchemas(app);
  await app.register(prismaPlugin);
  await app.register(tenantPlugin);
  await app.register(authPlugin, {
    secret: env.JWT_SECRET,
    skipPaths: [
      '/',
      '/favicon.ico',
      '/health',
      '/ready',
      '/v1/auth/login',
      '/v1/auth/refresh',
      '/v1/auth/logout',
      '/v1/billing/webhook',
      '/v1/public',
      '/documentation',
      '/documentation/json',
    ],
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
  await app.register(publicFillRoutes);
  await app.register(engineRoutes, { prefix: '' });
  await app.register(aiRoutes);
  await app.register(auditRoutes);
  await app.register(patientsRoutes);
  await app.register(billingRoutes);
  await app.register(statsRoutes);

  return app;
}
