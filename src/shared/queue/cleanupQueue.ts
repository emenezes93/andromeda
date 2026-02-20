import { Queue, Worker, type Job } from 'bullmq';
import Redis from 'ioredis';
import type { PrismaClient } from '@prisma/client';
import { cleanupExpiredTokens } from '@shared/utils/cleanup.js';

const QUEUE_NAME = 'cleanup';
const CLEANUP_JOB_ID = 'cleanup-expired-tokens';
const REPEAT_PATTERN = '0 0 * * *'; // every day at midnight (cron)

export interface CleanupJobPayload {
  type: 'expired-tokens';
}

function createRedisConnection(url: string): Redis {
  return new Redis(url);
}

/**
 * Creates the cleanup queue and worker when REDIS_URL is set.
 * Schedules a repeatable job every 24h and processes it in-process.
 */
export function setupCleanupQueue(
  prisma: PrismaClient,
  redisUrl: string,
  log: { info: (o: object, msg: string) => void; error: (err: unknown, msg: string) => void }
): { queue: Queue<CleanupJobPayload>; worker: Worker<CleanupJobPayload>; stop: () => Promise<void> } {
  const queueConnection = createRedisConnection(redisUrl);
  const workerConnection = createRedisConnection(redisUrl);
  const queue = new Queue<CleanupJobPayload>(QUEUE_NAME, {
    connection: queueConnection,
    defaultJobOptions: {
      removeOnComplete: { count: 100 },
      attempts: 2,
      backoff: { type: 'exponential', delay: 5000 },
    },
  });

  const worker = new Worker<CleanupJobPayload>(
    QUEUE_NAME,
    async (job: Job<CleanupJobPayload>) => {
      if (job.data.type !== 'expired-tokens') return;
      const deleted = await cleanupExpiredTokens(prisma);
      if (deleted > 0) {
        log.info({ deleted, jobId: job.id }, 'Cleaned up expired refresh tokens');
      }
      return { deleted };
    },
    { connection: workerConnection, concurrency: 1 }
  );

  worker.on('failed', (job: Job<CleanupJobPayload> | undefined, err: Error) => {
    log.error(err, `Cleanup job ${job?.id} failed`);
  });

  // Schedule repeatable job (idempotent: same jobId replaces)
  queue
    .add(CLEANUP_JOB_ID, { type: 'expired-tokens' }, { repeat: { pattern: REPEAT_PATTERN }, jobId: CLEANUP_JOB_ID })
    .catch((err: unknown) => {
      log.error(err, 'Failed to schedule cleanup repeatable job');
    });

  const stop = async () => {
    await worker.close();
    await queue.close();
    const conns = [queueConnection, workerConnection] as Array<{ quit?: () => Promise<string> }>;
    await Promise.all(conns.map((c) => (c.quit ? c.quit() : Promise.resolve('OK'))));
  };

  return { queue, worker, stop };
}
