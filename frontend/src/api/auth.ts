import type {
  LoginResponse,
  LoginRequiresTwoFactor,
  TwoFactorStatusResponse,
  TwoFactorSetupStartResponse,
} from '@/types';
import { apiFetch } from './client';

export async function login(
  email: string,
  password: string
): Promise<LoginResponse | LoginRequiresTwoFactor> {
  return apiFetch<LoginResponse | LoginRequiresTwoFactor>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
  });
}

export async function login2fa(
  email: string,
  password: string,
  twoFactorCode?: string,
  backupCode?: string
): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/v1/auth/login-2fa', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      ...(twoFactorCode && { twoFactorCode }),
      ...(backupCode && { backupCode }),
    }),
    skipAuth: true,
  });
}

export async function get2faStatus(): Promise<TwoFactorStatusResponse> {
  return apiFetch<TwoFactorStatusResponse>('/v1/auth/2fa/status');
}

export async function start2faSetup(): Promise<TwoFactorSetupStartResponse> {
  return apiFetch<TwoFactorSetupStartResponse>('/v1/auth/2fa/setup/start', {
    method: 'POST',
  });
}

export async function verify2faSetup(token: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/v1/auth/2fa/setup/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function disable2fa(password: string): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/v1/auth/2fa/disable', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function logout(refreshToken: string): Promise<void> {
  try {
    await apiFetch('/v1/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  } finally {
    // clear local state even if API fails
  }
}
