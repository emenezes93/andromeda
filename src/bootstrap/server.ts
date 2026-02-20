import { buildApp } from './app.js';
import { env } from '@config/env.js';
import { cleanupExpiredTokens } from '@shared/utils/cleanup.js';
import { setupCleanupQueue } from '@shared/queue/cleanupQueue.js';
import { startScheduledQuestionnairesJob } from '../modules/scheduled-questionnaires/job.js';

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours (fallback when Redis is not used)

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (err) {
    app.log.fatal(err);
    process.exit(1);
  }

  startScheduledQuestionnairesJob(app.prisma, app.log);

  let cleanupStop: (() => Promise<void>) | null = null;
  if (env.REDIS_URL) {
    const { stop } = setupCleanupQueue(app.prisma, env.REDIS_URL, app.log);
    cleanupStop = stop;
    app.log.info('Cleanup job scheduled via BullMQ (Redis)');
  } else {
    const cleanupIntervalId = setInterval(async () => {
      try {
        const deleted = await cleanupExpiredTokens(app.prisma);
        if (deleted > 0) {
          app.log.info({ deleted }, 'Cleaned up expired refresh tokens');
        }
      } catch (err) {
        app.log.error(err, 'Failed to cleanup expired refresh tokens');
      }
    }, CLEANUP_INTERVAL_MS);
    cleanupStop = () => {
      clearInterval(cleanupIntervalId);
      return Promise.resolve();
    };
    app.log.info('Cleanup job running via setInterval (no Redis)');
  }

  const shutdown = async () => {
    if (cleanupStop) await cleanupStop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main();
