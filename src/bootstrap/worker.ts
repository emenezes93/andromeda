import Fastify from 'fastify';
import { env } from '@config/env.js';
import prismaPlugin from '@http/plugins/prisma.js';
import { startBackgroundJobs } from './background-jobs.js';

const APP_LOG_BASE = { service: 'andromeda-worker', app: 'Fit Insight' };

async function main() {
  if (!env.BACKGROUND_JOBS_ENABLED) {
    throw new Error('BACKGROUND_JOBS_ENABLED=false. Worker requires background jobs enabled.');
  }

  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      base: APP_LOG_BASE,
    },
  });

  await app.register(prismaPlugin);
  const backgroundJobs = await startBackgroundJobs(app.prisma, app.log);
  app.log.info('Background worker started');

  const shutdown = async () => {
    await backgroundJobs.stop();
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
