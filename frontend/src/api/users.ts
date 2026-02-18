import { apiFetch } from './client';
import type { TenantMember, TenantMembersResponse } from '@/types';

export async function listUsers(params?: {
  page?: number;
  limit?: number;
}): Promise<TenantMembersResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch<TenantMembersResponse>(`/v1/users${qs ? `?${qs}` : ''}`);
}

export async function createUser(body: {
  email: string;
  password: string;
  name?: string;
  role: string;
}): Promise<TenantMember> {
  return apiFetch<TenantMember>('/v1/users', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateUserRole(userId: string, role: string): Promise<TenantMember> {
  return apiFetch<TenantMember>(`/v1/users/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function removeUser(userId: string): Promise<void> {
  return apiFetch<void>(`/v1/users/${userId}`, {
    method: 'DELETE',
  });
}
