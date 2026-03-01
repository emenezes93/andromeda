import { z } from 'zod';
import { paginationQuerySchema } from '@shared/utils/pagination.js';

export const createDietPlanSchema = z.object({
  patientId: z.string().min(1),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  caloriesKcal: z.number().int().min(0).optional(),
  proteinG: z.number().min(0).optional(),
  carbsG: z.number().min(0).optional(),
  fatG: z.number().min(0).optional(),
  waterMl: z.number().int().min(0).optional(),
  restrictions: z.array(z.string()).optional().default([]),
  mealPlanJson: z.record(z.unknown()).optional(),
  basedOnSessionId: z.string().optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  active: z.boolean().optional().default(true),
});

export const updateDietPlanSchema = createDietPlanSchema.partial();

export const listDietPlansQuerySchema = paginationQuerySchema.extend({
  patientId: z.string().optional(),
  active: z.coerce.boolean().optional(),
  name: z.string().optional(),
});

const dietFoodSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(0),
  unit: z.string().min(1),
  caloriesKcal: z.number().min(0).default(0),
  proteinG: z.number().min(0).default(0),
  carbsG: z.number().min(0).default(0),
  fatG: z.number().min(0).default(0),
});

export const createDietEntrySchema = z.object({
  patientId: z.string().min(1),
  dietPlanId: z.string().optional(),
  entryDate: z.string().min(1),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'other']),
  foodsJson: z.array(dietFoodSchema).min(1),
  totalCalories: z.number().int().min(0).optional(),
  totalProteinG: z.number().min(0).optional(),
  totalCarbsG: z.number().min(0).optional(),
  totalFatG: z.number().min(0).optional(),
  waterMl: z.number().int().min(0).optional(),
  notes: z.string().optional(),
});

export const listDietEntriesQuerySchema = z.object({
  patientId: z.string().optional(),
  dietPlanId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack', 'other']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type CreateDietPlanBody = z.infer<typeof createDietPlanSchema>;
export type UpdateDietPlanBody = z.infer<typeof updateDietPlanSchema>;
export type ListDietPlansQuery = z.infer<typeof listDietPlansQuerySchema>;
export type CreateDietEntryBody = z.infer<typeof createDietEntrySchema>;
export type ListDietEntriesQuery = z.infer<typeof listDietEntriesQuerySchema>;
