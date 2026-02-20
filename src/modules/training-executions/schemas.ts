import { z } from 'zod';
import { paginationQuerySchema } from '@shared/utils/pagination.js';

export const createTrainingExecutionSchema = z.object({
  patientId: z.string().min(1),
  trainingPlanId: z.string().optional(),
  executedAt: z.string().min(1),
  durationMinutes: z.number().int().min(0).optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional().default(true),
});

export const listTrainingExecutionsQuerySchema = paginationQuerySchema.extend({
  patientId: z.string().optional(),
  trainingPlanId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateTrainingExecutionBody = z.infer<typeof createTrainingExecutionSchema>;
export type ListTrainingExecutionsQuery = z.infer<typeof listTrainingExecutionsQuerySchema>;
