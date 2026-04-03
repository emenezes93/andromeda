import cron from 'node-cron';
import type { PrismaClient } from '@prisma/client';
import type { FastifyBaseLogger } from 'fastify';
import { processScheduledQuestionnaires } from './scheduler.js';

/**
 * Inicia o job scheduler para processar agendamentos de questionários.
 * Roda uma vez ao subir o servidor (para agendamentos já vencidos) e depois diariamente às 07:00.
 */
export function startScheduledQuestionnairesJob(
  prisma: PrismaClient,
  logger: FastifyBaseLogger
): () => void {
  const run = async () => {
    try {
      logger.info('[Scheduler] Processando agendamentos de questionários...');
      const created = await processScheduledQuestionnaires(prisma, logger);
      logger.info({ created }, '[Scheduler] Sessões de questionários criadas');
    } catch (error) {
      logger.error({ error }, '[Scheduler] Erro ao processar agendamentos');
    }
  };

  // Executar logo ao subir (agendamentos já vencidos não esperam até a próxima hora)
  void run();

  // Executar diariamente às 07:00 (antes dos alertas de 08:00)
  const task = cron.schedule('0 7 * * *', run);

  logger.info(
    '[Scheduler] Job de agendamento de questionários iniciado (executa ao subir e diariamente às 07:00)'
  );
  return () => task.stop();
}
