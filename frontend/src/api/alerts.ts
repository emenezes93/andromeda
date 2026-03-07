import { apiFetch } from './client';

export interface Alert {
  id: string;
  patientId: string;
  patientName: string;
  type: string;
  severity: 'high' | 'medium' | 'low' | 'info';
  message: string;
  metadata: Record<string, unknown> | null;
  readAt: string | null;
  createdAt: string;
}

export interface AlertsListResponse {
  data: Alert[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    unreadCount: number;
  };
}

export interface ListAlertsParams {
  page?: number;
  limit?: number;
  severity?: 'high' | 'medium' | 'low' | 'info';
  read?: boolean;
  patientId?: string;
}

export async function listAlerts(params?: ListAlertsParams): Promise<AlertsListResponse> {
  const search = new URLSearchParams();
  if (params?.page != null) search.set('page', String(params.page));
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.severity) search.set('severity', params.severity);
  if (params?.read !== undefined) search.set('read', String(params.read));
  if (params?.patientId) search.set('patientId', params.patientId);
  const qs = search.toString();
  return apiFetch<AlertsListResponse>(`/v1/alerts${qs ? `?${qs}` : ''}`);
}

export async function markAlertRead(id: string): Promise<{ id: string; readAt: string }> {
  return apiFetch<{ id: string; readAt: string }>(`/v1/alerts/${id}/read`, {
    method: 'PATCH',
  });
}
