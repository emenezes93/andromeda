import type { LoginResponse } from '@/types';
import { apiFetch } from './client';

export async function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>('/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    skipAuth: true,
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
