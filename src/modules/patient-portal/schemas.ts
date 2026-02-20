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
  tenantId: z.string().min(1), // tenantId vem do header ou body
});

export type PatientRegisterBody = z.infer<typeof patientRegisterSchema>;
