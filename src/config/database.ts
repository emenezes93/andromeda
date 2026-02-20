import type { PrismaClient } from '@prisma/client';
import { PrismaClient as PrismaClientConstructor } from '@prisma/client';

/** Minimal type for Prisma $use middleware (avoids depending on generated client exports in Docker). */
interface PrismaUseParams {
  action: string;
  model?: string;
  args?: { where?: Record<string, unknown> };
}

/**
 * Database Configuration
 * Centralizes Prisma client configuration and lifecycle
 */

export function createPrismaClient(
  logLevel: 'trace' | 'info' | 'warn' | 'error' = 'warn'
): PrismaClient {
  const prisma = new PrismaClientConstructor({
    log: logLevel === 'trace' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  });

  // Soft delete middleware: auto-filter deleted records on reads
  const SOFT_DELETE_MODELS = [
    'Tenant',
    'User',
    'AnamnesisTemplate',
    'AnamnesisSession',
    'Patient',
    'ScheduledQuestionnaire',
    'PatientGoal',
    'TrainingPlan',
    'ProgressPhoto',
  ];

  const softDeleteMiddleware = async (
    params: PrismaUseParams,
    next: (params: PrismaUseParams) => Promise<unknown>
  ): Promise<unknown> => {
    if (
      (params.action === 'findMany' ||
        params.action === 'findFirst' ||
        params.action === 'findUnique') &&
      params.model &&
      SOFT_DELETE_MODELS.includes(params.model)
    ) {
      params.args = params.args ?? {};
      params.args.where = { ...params.args.where, deletedAt: null };
    }
    return next(params);
  };
  prisma.$use(softDeleteMiddleware as never);

  return prisma;
}

export async function setupTenantContext(prisma: PrismaClient, tenantId: string): Promise<void> {
  await prisma.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
}

export async function clearTenantContext(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRaw`SELECT set_config('app.tenant_id', '', true)`;
}
