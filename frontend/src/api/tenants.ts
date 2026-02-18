import { apiFetch } from './client';
import type { Tenant, TenantListResponse } from '@/types';

export async function listTenants(params?: {
  page?: number;
  limit?: number;
}): Promise<TenantListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  const qs = search.toString();
  return apiFetch<TenantListResponse>(`/v1/tenants${qs ? `?${qs}` : ''}`);
}

export async function createTenant(body: {
  name: string;
  status?: 'active' | 'suspended';
}): Promise<Tenant> {
  return apiFetch<Tenant>('/v1/tenants', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function getTenant(id: string): Promise<Tenant> {
  return apiFetch<Tenant>(`/v1/tenants/${id}`);
}

export async function updateTenant(
  id: string,
  body: { name?: string; status?: 'active' | 'suspended' }
): Promise<Tenant> {
  return apiFetch<Tenant>(`/v1/tenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}
