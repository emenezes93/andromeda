import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos 1 letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter ao menos 1 letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos 1 número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter ao menos 1 caractere especial'),
  name: z.string().optional(),
  role: z.enum(['admin', 'practitioner', 'viewer']).default('practitioner'),
});

export type CreateUserBody = z.infer<typeof createUserSchema>;
