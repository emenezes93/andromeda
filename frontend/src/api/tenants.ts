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
  body: {
    name?: string;
    status?: 'active' | 'suspended';
    emailAlertsEnabled?: boolean;
    logoUrl?: string | null;
    brandColor?: string | null;
  }
): Promise<Tenant> {
  return apiFetch<Tenant>(`/v1/tenants/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function uploadTenantLogo(
  tenantId: string,
  file: File
): Promise<{ logoUrl: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('token');
  const tid = localStorage.getItem('tenantId');
  const headers: HeadersInit = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tid) headers['x-tenant-id'] = tid;
  const API_URL = import.meta.env.VITE_API_URL || '';
  const res = await fetch(`${API_URL}/v1/tenants/${tenantId}/logo`, {
    method: 'POST',
    headers,
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Erro ${res.status}`);
  }
  return res.json();
}
