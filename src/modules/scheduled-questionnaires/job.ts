import cron from 'node-cron';
import type { PrismaClient } from '@prisma/client';
import type { FastifyBaseLogger } from 'fastify';
import { processScheduledQuestionnaires } from './scheduler.js';

/**
 * Inicia o job scheduler para processar agendamentos de questionários
 * Executa a cada hora (minuto 0)
 */
export function startScheduledQuestionnairesJob(
  prisma: PrismaClient,
  logger: FastifyBaseLogger
): void {
  // Executar a cada hora (minuto 0)
  cron.schedule('0 * * * *', async () => {
    try {
      logger.info('[Scheduler] Processando agendamentos de questionários...');
      const created = await processScheduledQuestionnaires(prisma, logger);
      logger.info({ created }, '[Scheduler] Sessões de questionários criadas');
    } catch (error) {
      logger.error({ error }, '[Scheduler] Erro ao processar agendamentos');
    }
  });

  logger.info('[Scheduler] Job de agendamento de questionários iniciado (executa a cada hora)');
}
