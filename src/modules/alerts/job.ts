import cron from 'node-cron';
import type { PrismaClient } from '@prisma/client';
import type { FastifyBaseLogger } from 'fastify';
import { env } from '@config/env.js';
import { runAlertEngine } from './engine.js';
import { sendDailyAlertsEmails } from './email.js';

/**
 * Runs the alert engine once at 08:00 every day (and once on startup for testing).
 * After the engine, sends daily summary email to tenants with emailAlertsEnabled (if SMTP configured).
 */
export function startAlertsJob(prisma: PrismaClient, logger: FastifyBaseLogger): void {
  const run = async () => {
    try {
      logger.info('[Alerts] Executando motor de alertas...');
      const { created } = await runAlertEngine(prisma);
      logger.info({ created }, '[Alerts] Alertas criados');

      const baseUrl = env.FRONTEND_URL || 'http://localhost:5173';
      const { sent } = await sendDailyAlertsEmails(prisma, baseUrl);
      if (sent > 0) logger.info({ sent }, '[Alerts] Emails de resumo enviados');
    } catch (error) {
      logger.error({ error }, '[Alerts] Erro ao executar motor de alertas');
    }
  };

  void run();
  cron.schedule('0 8 * * *', run);

  logger.info('[Alerts] Job de alertas iniciado (executa ao subir e todo dia às 08:00)');
}
