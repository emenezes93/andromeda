import { z } from 'zod';
import { paginationQuerySchema } from '@shared/utils/pagination.js';

export const createProgressPhotoSchema = z.object({
  patientId: z.string().min(1),
  imageUrl: z.string().url(),
  takenAt: z.string().min(1),
  notes: z.string().optional(),
});

export const updateProgressPhotoSchema = z.object({
  imageUrl: z.string().url().optional(),
  takenAt: z.string().optional(),
  notes: z.string().optional(),
});

export const listProgressPhotosQuerySchema = paginationQuerySchema.extend({
  patientId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

export type CreateProgressPhotoBody = z.infer<typeof createProgressPhotoSchema>;
export type UpdateProgressPhotoBody = z.infer<typeof updateProgressPhotoSchema>;
export type ListProgressPhotosQuery = z.infer<typeof listProgressPhotosQuerySchema>;
