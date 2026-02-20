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
import { billingRoutes } from '../modules/billing/routes.js';
import { patientPortalRoutes } from '../modules/patient-portal/routes.js';
import { scheduledQuestionnairesRoutes } from '../modules/scheduled-questionnaires/routes.js';
import { trainingPlansRoutes } from '../modules/training-plans/routes.js';
import { trainingExecutionsRoutes } from '../modules/training-executions/routes.js';
import { progressPhotosRoutes } from '../modules/progress-photos/routes.js';
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
    req.rawBody = buf;
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
      '/v1/auth/login-2fa',
      '/v1/auth/refresh',
      '/v1/auth/logout',
      '/v1/patient-portal/login',
      '/v1/patient-portal/register',
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

  // Dependency Injection Container (hexagonal)
  const container = new Container(app.prisma, app.log);
  app.decorate('container', container);

  // Health routes (no auth required)
  await app.register(healthRoutes);

  // Auth + Users + Tenants (hexagonal architecture)
  container.authController.registerRoutes(app);
  container.userController.registerRoutes(app);
  container.tenantController.registerRoutes(app);
  container.patientController.registerRoutes(app);
  container.templateController.registerRoutes(app);
  container.sessionController.registerRoutes(app);
  container.insightController.registerRoutes(app);
  container.auditController.registerRoutes(app);
  container.statsController.registerRoutes(app);
  container.goalController.registerRoutes(app);

  // Legacy routes (migrating progressively to hexagonal)
  const { patientsLegacyRoutes } = await import('../modules/patients-legacy/routes.js');
  await app.register(patientsLegacyRoutes);
  await app.register(billingRoutes);
  await app.register(patientPortalRoutes);
  await app.register(scheduledQuestionnairesRoutes);
  await app.register(trainingPlansRoutes);
  await app.register(trainingExecutionsRoutes);
  await app.register(progressPhotosRoutes);

  return app;
}
