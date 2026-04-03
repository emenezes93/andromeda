import type { FastifyInstance } from 'fastify';
import { registerPatientPortalAuthRoutes } from './routes/auth.routes.js';
import { registerPatientPortalNotificationRoutes } from './routes/notifications.routes.js';
import { registerPatientPortalDataRoutes } from './routes/data.routes.js';
import { registerPatientPortalMobileRoutes } from './routes/mobile.routes.js';

/**
 * Patient portal HTTP surface split across `routes/*.routes.ts` for reviewability.
 * Register order is irrelevant (distinct paths).
 */
export async function patientPortalRoutes(fastify: FastifyInstance): Promise<void> {
  await registerPatientPortalAuthRoutes(fastify);
  await registerPatientPortalNotificationRoutes(fastify);
  await registerPatientPortalDataRoutes(fastify);
  await registerPatientPortalMobileRoutes(fastify);
}
