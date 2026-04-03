import NetInfo from '@react-native-community/netinfo';
import { apiFetch } from './client';
import { isDevToken } from './andromeda';
import { getMockTrainingPlansResponse, getMockTrainingPlan } from './mockData';
import { getCachedTrainingPlans, setCachedTrainingPlans, getCachedTrainingPlan, setCachedTrainingPlan } from '../storage/plansCache';
import type { TrainingPlanSummary, TrainingPlanDetail, ListMeta } from '../types';

export interface TrainingPlansResponse {
  data: TrainingPlanSummary[];
  meta: ListMeta;
}

/** Lista planos de treino encaminhados ao paciente (API Andromeda). Em modo demo retorna exemplos. F6.4: usa cache quando offline. */
export async function getMyTrainingPlans(
  token: string,
  tenantId: string,
  params?: { page?: number; limit?: number; active?: boolean }
): Promise<TrainingPlansResponse> {
  if (isDevToken(token)) {
    return Promise.resolve(getMockTrainingPlansResponse());
  }
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    const cached = await getCachedTrainingPlans();
    if (cached) return cached;
    throw new Error('Sem conexão. Dados em cache não disponíveis.');
  }
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.active !== undefined) q.set('active', String(params.active));
  const query = q.toString();
  const result = await apiFetch<TrainingPlansResponse>(
    `/v1/patient-portal/my-training-plans${query ? `?${query}` : ''}`,
    { token, tenantId }
  );
  await setCachedTrainingPlans(result);
  return result;
}

/** Detalhe de um plano de treino (API Andromeda). Em modo demo retorna exemplo. F6.4: usa cache quando offline. */
export async function getMyTrainingPlan(
  id: string,
  token: string,
  tenantId: string
): Promise<TrainingPlanDetail> {
  if (isDevToken(token)) {
    const mock = getMockTrainingPlan(id);
    if (!mock) throw new Error('Plano não encontrado');
    return Promise.resolve(mock);
  }
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    const cached = await getCachedTrainingPlan(id);
    if (cached) return cached;
    throw new Error('Sem conexão. Dados em cache não disponíveis.');
  }
  const result = await apiFetch<TrainingPlanDetail>(
    `/v1/patient-portal/my-training-plans/${id}`,
    { token, tenantId }
  );
  await setCachedTrainingPlan(id, result);
  return result;
}

export interface LogWorkoutBody {
  trainingPlanId?: string | null;
  executedAt: string; // ISO date
  durationMinutes?: number | null;
  notes?: string | null;
  completed?: boolean;
}

/** Registra treino realizado (API Andromeda). Em modo demo simula sucesso. */
export async function logWorkout(
  body: LogWorkoutBody,
  token: string,
  tenantId: string
): Promise<{ id: string; executedAt: string; durationMinutes: number | null; completed: boolean }> {
  if (isDevToken(token)) {
    return Promise.resolve({
      id: 'mock-exec-' + Date.now(),
      executedAt: body.executedAt,
      durationMinutes: body.durationMinutes ?? 45,
      completed: body.completed ?? true,
    });
  }
  return apiFetch('/v1/patient-portal/my-training-executions', {
    method: 'POST',
    body: JSON.stringify(body),
    token,
    tenantId,
  });
}
