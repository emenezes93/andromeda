import { z } from 'zod';

export const CONSENT_VERSION = '1.0';

export const createPatientSchema = z.object({
  fullName: z.string().min(2).max(255),
  birthDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida (use YYYY-MM-DD)')
    .optional()
    .nullable(),
  gender: z.enum(['M', 'F', 'Other', 'Prefer not to say']).optional().nullable(),
  cpf: z
    .string()
    .regex(/^\d{11}$/, 'CPF deve ter 11 dígitos numéricos')
    .optional()
    .nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  profession: z.string().max(100).optional().nullable(),
  mainGoal: z.string().max(2000).optional().nullable(),
  mainComplaint: z.string().max(2000).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  consentVersion: z.string().max(20).optional(),
});

export const updatePatientSchema = createPatientSchema.partial();

export const createEvolutionSchema = z.object({
  recordedAt: z.string().datetime({ offset: true }),
  weightKg: z.number().positive().optional().nullable(),
  heightCm: z.number().positive().optional().nullable(),
  bmi: z.number().positive().optional().nullable(),
  waistCm: z.number().positive().optional().nullable(),
  hipCm: z.number().positive().optional().nullable(),
  waistHipRatio: z.number().positive().optional().nullable(),
  bodyFatPercent: z.number().min(0).max(100).optional().nullable(),
  bloodPressureSystolic: z.number().int().positive().optional().nullable(),
  bloodPressureDiastolic: z.number().int().positive().optional().nullable(),
  heartRateBpm: z.number().int().positive().optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
});

export const listPatientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(255).optional(),
});

export type CreatePatientBody = z.infer<typeof createPatientSchema>;
export type UpdatePatientBody = z.infer<typeof updatePatientSchema>;
export type CreateEvolutionBody = z.infer<typeof createEvolutionSchema>;
