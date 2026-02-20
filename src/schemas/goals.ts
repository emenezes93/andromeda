import { z } from 'zod';
import { paginationQuerySchema } from '@shared/utils/pagination.js';

export const createGoalSchema = z.object({
  patientId: z.string().min(1),
  type: z.enum(['weight_loss', 'muscle_gain', 'performance', 'health', 'other']),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  currentValue: z.number().optional(),
  targetValue: z.number(),
  unit: z.string().min(1).max(20),
  startDate: z.string().min(1),
  targetDate: z.string().min(1),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  achievedAt: z.string().optional(),
});

export const listGoalsQuerySchema = paginationQuerySchema.extend({
  patientId: z.string().optional(),
  type: z.enum(['weight_loss', 'muscle_gain', 'performance', 'health', 'other']).optional(),
  achieved: z.coerce.boolean().optional(),
});

export type CreateGoalBody = z.infer<typeof createGoalSchema>;
export type UpdateGoalBody = z.infer<typeof updateGoalSchema>;
export type ListGoalsQuery = z.infer<typeof listGoalsQuerySchema>;
