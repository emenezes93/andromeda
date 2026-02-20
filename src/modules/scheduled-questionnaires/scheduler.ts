/**
 * Utilitários para calcular próximas execuções de agendamentos
 */
import type { PrismaClient } from '@prisma/client';

export type Frequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly';

/**
 * Calcula a próxima data de execução baseada na frequência e configuração
 */
export function calculateNextRun(
  frequency: Frequency,
  startDate: Date,
  dayOfWeek: number | null,
  dayOfMonth: number | null
): Date | null {
  const now = new Date();
  const start = new Date(startDate);

  // Se startDate está no futuro, retornar startDate
  if (start > now) {
    return start;
  }

  switch (frequency) {
    case 'weekly': {
      if (dayOfWeek === null || dayOfWeek === undefined) return null;
      const next = new Date(now);
      const currentDay = next.getDay();
      const daysUntilNext = (dayOfWeek - currentDay + 7) % 7 || 7; // Se hoje é o dia, agendar para próxima semana
      next.setDate(next.getDate() + daysUntilNext);
      next.setHours(9, 0, 0, 0); // 9h da manhã
      return next;
    }

    case 'biweekly': {
      if (dayOfWeek === null || dayOfWeek === undefined) return null;
      // Find the first occurrence of dayOfWeek on or after startDate
      const first = new Date(start);
      first.setHours(9, 0, 0, 0);
      while (first.getDay() !== dayOfWeek) {
        first.setDate(first.getDate() + 1);
      }
      // Advance in 14-day intervals until the date is strictly in the future
      const next = new Date(first);
      while (next <= now) {
        next.setDate(next.getDate() + 14);
      }
      return next;
    }

    case 'monthly': {
      if (dayOfMonth === null || dayOfMonth === undefined) return null;
      const next = new Date(now);
      next.setDate(dayOfMonth);
      next.setHours(9, 0, 0, 0);
      // Se já passou este mês, avançar para o próximo mês
      if (next <= now) {
        next.setMonth(next.getMonth() + 1);
        next.setDate(dayOfMonth);
      }
      return next;
    }

    case 'quarterly': {
      if (dayOfMonth === null || dayOfMonth === undefined) return null;
      const next = new Date(now);
      next.setDate(dayOfMonth);
      next.setHours(9, 0, 0, 0);
      // Encontrar o próximo trimestre (jan, abr, jul, out)
      const currentMonth = next.getMonth();
      const quarterMonths = [0, 3, 6, 9]; // jan, abr, jul, out
      let targetMonth = quarterMonths.find((m) => m > currentMonth) ?? quarterMonths[0];
      if (targetMonth <= currentMonth) {
        // Próximo ano
        next.setFullYear(next.getFullYear() + 1);
        targetMonth = quarterMonths[0];
      }
      next.setMonth(targetMonth);
      next.setDate(dayOfMonth);
      return next;
    }

    default:
      return null;
  }
}

/**
 * Processa agendamentos que devem ser executados agora
 * Retorna lista de sessões criadas
 */
export async function processScheduledQuestionnaires(
  prisma: PrismaClient,
  logger: { error(data: unknown, msg: string): void }
): Promise<number> {
  const now = new Date();
  const cutoff = new Date(now.getTime() + 60 * 60 * 1000); // 1 hora no futuro (tolerância)

  const scheduled = await prisma.scheduledQuestionnaire.findMany({
    where: {
      active: true,
      deletedAt: null,
      nextRunAt: {
        lte: cutoff,
        not: null,
      },
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
    include: {
      template: true,
      tenant: true,
    },
  });

  let created = 0;

  for (const schedule of scheduled) {
    try {
      // Se patientId está definido, criar sessão apenas para esse paciente
      // Caso contrário, criar para todos os pacientes do tenant
      if (schedule.patientId) {
        await prisma.anamnesisSession.create({
          data: {
            tenantId: schedule.tenantId,
            templateId: schedule.templateId,
            patientId: schedule.patientId,
            status: 'in_progress',
          },
        });
        created++;
      } else {
        // Criar para todos os pacientes ativos do tenant
        const patients = await prisma.patient.findMany({
          where: {
            tenantId: schedule.tenantId,
            deletedAt: null,
          },
        });

        for (const patient of patients) {
          await prisma.anamnesisSession.create({
            data: {
              tenantId: schedule.tenantId,
              templateId: schedule.templateId,
              patientId: patient.id,
              status: 'in_progress',
            },
          });
          created++;
        }
      }

      // Recalcular próxima execução
      const nextRunAt = calculateNextRun(
        schedule.frequency as Frequency,
        schedule.startDate,
        schedule.dayOfWeek,
        schedule.dayOfMonth
      );

      await prisma.scheduledQuestionnaire.update({
        where: { id: schedule.id },
        data: {
          lastRunAt: now,
          nextRunAt,
        },
      });
    } catch (error) {
      logger.error({ error, scheduleId: schedule.id }, 'Erro ao processar agendamento');
      // Continuar com próximo agendamento
    }
  }

  return created;
}
