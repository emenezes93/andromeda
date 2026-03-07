import { z } from 'zod';
import { paginationQuerySchema } from '@shared/utils/pagination.js';

const muscleGroups = [
  'chest',
  'back',
  'shoulders',
  'arms',
  'legs',
  'core',
  'cardio',
  'other',
] as const;
const equipmentOptions = [
  'barbell',
  'dumbbell',
  'cable',
  'machine',
  'bodyweight',
  'band',
  'other',
] as const;

export const createExerciseSchema = z.object({
  name: z.string().min(1).max(255),
  muscleGroup: z.enum(muscleGroups),
  equipment: z.enum(equipmentOptions).optional().nullable(),
  videoUrl: z.string().url().optional().nullable().or(z.literal('')),
});

export const updateExerciseSchema = createExerciseSchema.partial();

export const listExercisesQuerySchema = paginationQuerySchema.extend({
  muscleGroup: z.enum(muscleGroups).optional(),
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional(),
});

export type CreateExerciseBody = z.infer<typeof createExerciseSchema>;
export type UpdateExerciseBody = z.infer<typeof updateExerciseSchema>;
export type ListExercisesQuery = z.infer<typeof listExercisesQuerySchema>;
