import { z } from 'zod';

export const createTenantSchema = z.object({
  name: z.string().min(1).max(255),
  status: z.enum(['active', 'suspended']).optional().default('active'),
});

export const updateTenantSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z.enum(['active', 'suspended']).optional(),
});

export type CreateTenantBody = z.infer<typeof createTenantSchema>;
export type UpdateTenantBody = z.infer<typeof updateTenantSchema>;
