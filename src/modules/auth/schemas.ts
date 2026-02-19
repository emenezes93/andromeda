import { z } from 'zod';

export const strongPassword = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .regex(/[A-Z]/, 'Senha deve conter ao menos 1 letra maiúscula')
  .regex(/[a-z]/, 'Senha deve conter ao menos 1 letra minúscula')
  .regex(/[0-9]/, 'Senha deve conter ao menos 1 número')
  .regex(/[^A-Za-z0-9]/, 'Senha deve conter ao menos 1 caractere especial');

export const loginBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const registerBodySchema = z.object({
  email: z.string().email(),
  password: strongPassword,
  name: z.string().optional(),
});

export const refreshBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const logoutBodySchema = z.object({
  refreshToken: z.string().min(1),
});

export const changePasswordBodySchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: strongPassword,
});

export const loginWithTwoFactorBodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  twoFactorCode: z.string().optional(),
  backupCode: z.string().optional(),
});

export const setupTwoFactorBodySchema = z.object({
  token: z.string().length(6), // TOTP token to verify
});

export const disableTwoFactorBodySchema = z.object({
  password: z.string().min(1),
});

export type LoginBody = z.infer<typeof loginBodySchema>;
export type RegisterBody = z.infer<typeof registerBodySchema>;
export type RefreshBody = z.infer<typeof refreshBodySchema>;
export type LogoutBody = z.infer<typeof logoutBodySchema>;
export type ChangePasswordBody = z.infer<typeof changePasswordBodySchema>;
export type LoginWithTwoFactorBody = z.infer<typeof loginWithTwoFactorBodySchema>;
export type SetupTwoFactorBody = z.infer<typeof setupTwoFactorBodySchema>;
export type DisableTwoFactorBody = z.infer<typeof disableTwoFactorBodySchema>;
