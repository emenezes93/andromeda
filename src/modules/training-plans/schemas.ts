import { z } from 'zod';
import { paginationQuerySchema } from '@shared/utils/pagination.js';

export const createTrainingPlanSchema = z.object({
  patientId: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  planJson: z.record(z.unknown()),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export const updateTrainingPlanSchema = createTrainingPlanSchema.partial();

export const listTrainingPlansQuerySchema = paginationQuerySchema.extend({
  patientId: z.string().optional(),
  active: z.coerce.boolean().optional(),
});

export type CreateTrainingPlanBody = z.infer<typeof createTrainingPlanSchema>;
export type UpdateTrainingPlanBody = z.infer<typeof updateTrainingPlanSchema>;
export type ListTrainingPlansQuery = z.infer<typeof listTrainingPlansQuerySchema>;
