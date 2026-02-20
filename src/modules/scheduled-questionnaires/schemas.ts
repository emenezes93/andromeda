import { z } from 'zod';
import { paginationQuerySchema } from '@shared/utils/pagination.js';

export const createScheduledQuestionnaireSchema = z.object({
  templateId: z.string().min(1),
  patientId: z.string().optional(), // null = todos os pacientes do tenant
  frequency: z.enum(['weekly', 'biweekly', 'monthly', 'quarterly']),
  dayOfWeek: z.number().int().min(0).max(6).optional(), // 0-6 (domingo-sábado)
  dayOfMonth: z.number().int().min(1).max(31).optional(), // 1-31
  startDate: z.string().min(1), // ISO date or datetime
  endDate: z.string().optional(),
});

export const updateScheduledQuestionnaireSchema = createScheduledQuestionnaireSchema
  .partial()
  .extend({
    active: z.boolean().optional(),
  });

export const listScheduledQuestionnairesQuerySchema = paginationQuerySchema.extend({
  patientId: z.string().optional(),
  templateId: z.string().optional(),
  active: z.coerce.boolean().optional(),
});

export type CreateScheduledQuestionnaireBody = z.infer<typeof createScheduledQuestionnaireSchema>;
export type UpdateScheduledQuestionnaireBody = z.infer<typeof updateScheduledQuestionnaireSchema>;
export type ListScheduledQuestionnairesQuery = z.infer<typeof listScheduledQuestionnairesQuerySchema>;
