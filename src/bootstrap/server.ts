import { buildApp } from './app.js';
import { env } from '@config/env.js';
import { cleanupExpiredTokens } from '@shared/utils/cleanup.js';

const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

async function main() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.PORT, host: env.HOST });
  } catch (err) {
    app.log.fatal(err);
    process.exit(1);
  }

  const cleanupInterval = setInterval(async () => {
    try {
      const deleted = await cleanupExpiredTokens(app.prisma);
      if (deleted > 0) {
        app.log.info({ deleted }, 'Cleaned up expired refresh tokens');
      }
    } catch (err) {
      app.log.error(err, 'Failed to cleanup expired refresh tokens');
    }
  }, CLEANUP_INTERVAL_MS);

  const shutdown = async () => {
    clearInterval(cleanupInterval);
    await app.close();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main();
