import type { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';

export type PatientNotificationType =
  | 'plan_assigned'
  | 'training_plan_assigned'
  | 'diet_plan_assigned'
  | 'questionnaire_session_created';

export interface CreatePatientNotificationInput {
  tenantId: string;
  patientId: string;
  type: PatientNotificationType;
  metadata?: Record<string, unknown>;
}

/**
 * Cria uma notificação para o paciente (portal do aluno).
 * Idempotência: opcional dedupe por (patientId, type, chave em metadata) em janela de tempo;
 * por padrão sempre cria (dedupe pode ser feita no caller para updates).
 */
export async function createPatientNotification(
  prisma: PrismaClient,
  input: CreatePatientNotificationInput
): Promise<{ id: string; createdAt: Date }> {
  const row = await prisma.patientNotification.create({
    data: {
      tenantId: input.tenantId,
      patientId: input.patientId,
      type: input.type,
      metadata: (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
    },
    select: { id: true, createdAt: true },
  });
  return { id: row.id, createdAt: row.createdAt };
}

/**
 * Evita duplicata no mesmo dia para (patientId, type, planId ou sessionId).
 * Retorna true se já existe uma notificação com mesma chave hoje.
 */
export async function hasDuplicateToday(
  prisma: PrismaClient,
  tenantId: string,
  patientId: string,
  type: PatientNotificationType,
  dedupeKey: string,
  dedupeValue: string
): Promise<boolean> {
  const startOfDay = new Date();
  startOfDay.setUTCHours(0, 0, 0, 0);
  const count = await prisma.patientNotification.count({
    where: {
      tenantId,
      patientId,
      type,
      createdAt: { gte: startOfDay },
      metadata: { path: [dedupeKey], equals: dedupeValue },
    },
  });
  return count > 0;
}
