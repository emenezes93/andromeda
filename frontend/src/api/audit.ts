import type { AuditListResponse } from '@/types';
import { apiFetch } from './client';

export interface ListAuditParams {
  page?: number;
  limit?: number;
  action?: string;
  entity?: string;
  from?: string;
  to?: string;
}

export async function listAudit(params: ListAuditParams = {}): Promise<AuditListResponse> {
  const search = new URLSearchParams();
  if (params.page != null) search.set('page', String(params.page));
  if (params.limit != null) search.set('limit', String(params.limit));
  if (params.action) search.set('action', params.action);
  if (params.entity) search.set('entity', params.entity);
  if (params.from) search.set('from', params.from);
  if (params.to) search.set('to', params.to);
  const qs = search.toString();
  return apiFetch<AuditListResponse>(`/v1/audit${qs ? `?${qs}` : ''}`);
}
