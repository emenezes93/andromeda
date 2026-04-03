import { buildApp } from './app.js';
import { env } from '@config/env.js';
import { startBackgroundJobs } from './background-jobs.js';

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    app.log.info({ port: env.PORT, host: env.HOST }, 'Andromeda (Fit Insight) listening');
  } catch (err) {
    app.log.fatal(err);
    process.exit(1);
  }

  let cleanupStop: (() => Promise<void>) | null = null;
  if (env.BACKGROUND_JOBS_ENABLED) {
    const backgroundJobs = await startBackgroundJobs(app.prisma, app.log);
    cleanupStop = backgroundJobs.stop;
  } else {
    app.log.info('Background jobs disabled for this instance');
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
