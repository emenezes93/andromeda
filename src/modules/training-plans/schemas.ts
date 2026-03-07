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
  active: z.preprocess((v) => (v === 'false' ? false : v === 'true' ? true : v), z.boolean().optional()),
  name: z.string().optional(),
});

export const duplicateTrainingPlanSchema = z.object({
  patientId: z.string().min(1),
  name: z.string().max(255).optional(),
});

export type CreateTrainingPlanBody = z.infer<typeof createTrainingPlanSchema>;
export type UpdateTrainingPlanBody = z.infer<typeof updateTrainingPlanSchema>;
export type ListTrainingPlansQuery = z.infer<typeof listTrainingPlansQuerySchema>;
export type DuplicateTrainingPlanBody = z.infer<typeof duplicateTrainingPlanSchema>;
