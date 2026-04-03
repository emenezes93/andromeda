/**
 * API patient-portal: notificações do paciente (PROMPT_APP_MOBILE §4.7).
 */
import { apiFetch } from './client';
import { isDevToken } from './andromeda';
import type { ListMeta } from '../types';

export interface PatientNotification {
  id: string;
  title: string;
  body: string | null;
  read: boolean;
  createdAt: string;
  type?: string | null;
  metadata?: Record<string, unknown> | string | null;
}

export interface NotificationsResponse {
  data: PatientNotification[];
  meta: ListMeta;
}

interface BackendNotification {
  id: string;
  type?: string | null;
  metadata?: Record<string, unknown> | string | null;
  readAt?: string | null;
  createdAt: string;
}

function buildNotificationCopy(
  type?: string | null,
  metadata?: Record<string, unknown> | string | null
): Pick<PatientNotification, 'title' | 'body'> {
  const parsed =
    typeof metadata === 'string'
      ? (() => {
          try {
            return JSON.parse(metadata) as Record<string, unknown>;
          } catch {
            return null;
          }
        })()
      : metadata ?? null;

  const explicitTitle =
    typeof parsed?.title === 'string'
      ? parsed.title
      : typeof parsed?.messageTitle === 'string'
        ? parsed.messageTitle
        : null;
  const explicitBody =
    typeof parsed?.body === 'string'
      ? parsed.body
      : typeof parsed?.message === 'string'
        ? parsed.message
        : typeof parsed?.description === 'string'
          ? parsed.description
          : null;

  if (explicitTitle || explicitBody) {
    return {
      title: explicitTitle ?? 'Atualização',
      body: explicitBody ?? null,
    };
  }

  switch (type) {
    case 'questionnaire_session_created':
      return {
        title: 'Nova anamnese disponível',
        body: 'Preencha seu questionário para que seu profissional acompanhe sua evolução.',
      };
    case 'training_plan_assigned':
      return {
        title: 'Novo treino disponível',
        body: 'Seu plano de treino foi atualizado. Abra o app para conferir os detalhes.',
      };
    case 'diet_plan_assigned':
      return {
        title: 'Nova dieta disponível',
        body: 'Seu plano alimentar foi atualizado. Revise as orientações no app.',
      };
    default:
      return {
        title: 'Atualização do Fit Insight',
        body: 'Há uma novidade importante para você no app.',
      };
  }
}

export function mapBackendNotification(item: BackendNotification): PatientNotification {
  const copy = buildNotificationCopy(item.type, item.metadata);
  return {
    id: item.id,
    title: copy.title,
    body: copy.body,
    read: Boolean(item.readAt),
    createdAt: item.createdAt,
    type: item.type ?? null,
    metadata: item.metadata ?? null,
  };
}

export async function getMyNotifications(
  token: string,
  tenantId: string,
  params?: { page?: number; limit?: number }
): Promise<NotificationsResponse> {
  if (isDevToken(token)) {
    return Promise.resolve({
      data: [
        {
          id: 'mock-1',
          title: 'Bem-vindo ao Fit Insight',
          body: 'Seu treino e dieta no celular. Registre suas sessões e acompanhe sua evolução.',
          read: false,
          createdAt: new Date().toISOString(),
          type: 'system',
        },
      ],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1, hasMore: false },
    });
  }
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  const query = q.toString();
  const result = await apiFetch<{ data: BackendNotification[]; meta: ListMeta }>(
    `/v1/patient-portal/my-notifications${query ? `?${query}` : ''}`,
    { token, tenantId }
  );
  return {
    data: result.data.map(mapBackendNotification),
    meta: result.meta,
  };
}

export async function markNotificationAsRead(
  id: string,
  token: string,
  tenantId: string
): Promise<void> {
  if (isDevToken(token)) return;
  await apiFetch(`/v1/patient-portal/my-notifications/${id}/read`, {
    method: 'PATCH',
    token,
    tenantId,
  });
}
