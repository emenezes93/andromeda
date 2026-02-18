import type { User } from '@/types';

const TOKEN_KEY = 'token';
const REFRESH_KEY = 'refreshToken';
const USER_KEY = 'user';
const TENANT_KEY = 'tenantId';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function getStoredTenantId(): string | null {
  return localStorage.getItem(TENANT_KEY);
}

export function setAuth(token: string, refreshToken: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TENANT_KEY, user.tenantId);
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TENANT_KEY);
}

export function isAuthenticated(): boolean {
  return !!getStoredToken();
}
