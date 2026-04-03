import NetInfo from '@react-native-community/netinfo';
import { apiFetch } from './client';
import { isDevToken } from './andromeda';
import { getMockDietPlansResponse, getMockDietPlan } from './mockData';
import { getCachedDietPlans, setCachedDietPlans, getCachedDietPlan, setCachedDietPlan } from '../storage/plansCache';
import type { DietPlanSummary, DietPlanDetail, ListMeta } from '../types';

export interface DietPlansResponse {
  data: DietPlanSummary[];
  meta: ListMeta;
}

/** Lista planos de dieta encaminhados ao paciente (API Andromeda). Em modo demo retorna exemplos. F6.4: usa cache quando offline. */
export async function getMyDietPlans(
  token: string,
  tenantId: string,
  params?: { page?: number; limit?: number; active?: boolean }
): Promise<DietPlansResponse> {
  if (isDevToken(token)) {
    return Promise.resolve(getMockDietPlansResponse());
  }
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    const cached = await getCachedDietPlans();
    if (cached) return cached;
    throw new Error('Sem conexão. Dados em cache não disponíveis.');
  }
  const q = new URLSearchParams();
  if (params?.page != null) q.set('page', String(params.page));
  if (params?.limit != null) q.set('limit', String(params.limit));
  if (params?.active !== undefined) q.set('active', String(params.active));
  const query = q.toString();
  const result = await apiFetch<DietPlansResponse>(
    `/v1/patient-portal/my-diet-plans${query ? `?${query}` : ''}`,
    { token, tenantId }
  );
  await setCachedDietPlans(result);
  return result;
}

/** Detalhe de um plano de dieta (API Andromeda). Em modo demo retorna exemplo. F6.4: usa cache quando offline. */
export async function getMyDietPlan(
  id: string,
  token: string,
  tenantId: string
): Promise<DietPlanDetail> {
  if (isDevToken(token)) {
    const mock = getMockDietPlan(id);
    if (!mock) throw new Error('Plano não encontrado');
    return Promise.resolve(mock);
  }
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    const cached = await getCachedDietPlan(id);
    if (cached) return cached;
    throw new Error('Sem conexão. Dados em cache não disponíveis.');
  }
  const result = await apiFetch<DietPlanDetail>(
    `/v1/patient-portal/my-diet-plans/${id}`,
    { token, tenantId }
  );
  await setCachedDietPlan(id, result);
  return result;
}
