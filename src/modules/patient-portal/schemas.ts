import { z } from 'zod';
import { strongPassword } from '../auth/schemas.js';

// Login do paciente (email + senha, retorna token)
export const patientLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type PatientLoginBody = z.infer<typeof patientLoginSchema>;

// Registro de paciente (cria User + Patient vinculado) — reutiliza validação de complexidade de senha
export const patientRegisterSchema = z.object({
  email: z.string().email(),
  password: strongPassword,
  fullName: z.string().min(1),
  tenantId: z.string().min(1).optional(), // tenantId vem do header ou body
});

export type PatientRegisterBody = z.infer<typeof patientRegisterSchema>;

// --- Mobile sync schemas ---

export const weightLogSchema = z.object({
  date: z.string().min(1),
  valueKg: z.number().positive(),
});

export const waterLogSchema = z.object({
  date: z.string().min(1),
  ml: z.number().int().positive(),
});

export const mealLogSchema = z.object({
  date: z.string().min(1),
  time: z.string().optional(),
  name: z.string().min(1),
  kcal: z.number().nonnegative().nullable().optional(),
  proteinG: z.number().nonnegative().nullable().optional(),
  carbsG: z.number().nonnegative().nullable().optional(),
  fatG: z.number().nonnegative().nullable().optional(),
});

export const bodyMeasurementSchema = z.object({
  date: z.string().min(1),
  waistCm: z.number().positive().nullable().optional(),
  hipCm: z.number().positive().nullable().optional(),
  chestCm: z.number().positive().nullable().optional(),
  armLeftCm: z.number().positive().nullable().optional(),
  armRightCm: z.number().positive().nullable().optional(),
  thighLeftCm: z.number().positive().nullable().optional(),
  thighRightCm: z.number().positive().nullable().optional(),
  neckCm: z.number().positive().nullable().optional(),
});

export const progressPhotoSchema = z.object({
  date: z.string().min(1),
  angle: z.string().nullable().optional(),
  uri: z.string().min(1),
});

export const pushTokenSchema = z.object({
  token: z.string().min(1),
  platform: z.enum(['ios', 'android']),
});

export const healthMetricsSchema = z.object({
  provider: z.string().min(1),
  date: z.string().min(1),
  steps: z.number().int().nonnegative().nullable().optional(),
  activeMinutes: z.number().int().nonnegative().nullable().optional(),
  sleepMinutes: z.number().int().nonnegative().nullable().optional(),
  source: z.string().min(1).optional(),
});
