import type { PrismaClient } from '@prisma/client';
import type { FastifyBaseLogger } from 'fastify';
import { env } from '@config/env.js';
import { cleanupExpiredTokens } from '@shared/utils/cleanup.js';
import { setupCleanupQueue } from '@shared/queue/cleanupQueue.js';
import { startScheduledQuestionnairesJob } from '../modules/scheduled-questionnaires/job.js';
import { startAlertsJob } from '../modules/alerts/job.js';

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface BackgroundJobsHandle {
  stop: () => Promise<void>;
}

export async function startBackgroundJobs(
  prisma: PrismaClient,
  logger: FastifyBaseLogger
): Promise<BackgroundJobsHandle> {
  const stopScheduledQuestionnairesJob = startScheduledQuestionnairesJob(prisma, logger);
  const stopAlertsJob = startAlertsJob(prisma, logger);

  let stopCleanup: (() => Promise<void>) | null = null;

  if (env.REDIS_URL) {
    const { stop } = setupCleanupQueue(prisma, env.REDIS_URL, logger);
    stopCleanup = stop;
    logger.info('Cleanup job scheduled via BullMQ (Redis)');
  } else {
    const cleanupIntervalId = setInterval(async () => {
      try {
        const deleted = await cleanupExpiredTokens(prisma);
        if (deleted > 0) {
          logger.info({ deleted }, 'Cleaned up expired refresh tokens');
        }
      } catch (err) {
        logger.error(err, 'Failed to cleanup expired refresh tokens');
      }
    }, CLEANUP_INTERVAL_MS);
    stopCleanup = () => {
      clearInterval(cleanupIntervalId);
      return Promise.resolve();
    };
    logger.info('Cleanup job running via setInterval (no Redis)');
  }

  return {
    stop: async () => {
      stopScheduledQuestionnairesJob();
      stopAlertsJob();
      if (stopCleanup) await stopCleanup();
    },
  };
}
