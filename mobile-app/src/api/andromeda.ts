/**
 * Integração com a plataforma Andromeda (API patient-portal).
 *
 * Base URL: EXPO_PUBLIC_API_URL no .env (ex.: http://10.0.2.2:3000 ou http://SEU_IP:3000)
 *
 * Headers em todas as requisições autenticadas:
 * - Content-Type: application/json
 * - x-tenant-id: código da organização (tenantId)
 * - Authorization: Bearer <token>
 *
 * Endpoints utilizados pelo app:
 *
 * Auth:
 *   POST /v1/patient-portal/login     body: { email, password }   header: x-tenant-id
 *   GET  /v1/patient-portal/me       headers: Authorization, x-tenant-id
 *
 * Treinos:
 *   GET  /v1/patient-portal/my-training-plans?page=&limit=&active=
 *   GET  /v1/patient-portal/my-training-plans/:id
 *   POST /v1/patient-portal/my-training-executions   body: { trainingPlanId?, executedAt, durationMinutes?, notes?, completed? }
 *
 * Dieta:
 *   GET  /v1/patient-portal/my-diet-plans?page=&limit=&active=
 *   GET  /v1/patient-portal/my-diet-plans/:id
 */

import { getBaseUrl } from './client';

/** Token usado no login de desenvolvimento (demo). Quando ativo, as chamadas à API são substituídas por dados mock. */
export const ANDROMEDA_DEV_TOKEN = 'dev-test-token';

export function isDevToken(token: string | null): boolean {
  return token === ANDROMEDA_DEV_TOKEN;
}

/** URL base da API Andromeda (para uso em configuração ou debug). */
export function getAndromedaBaseUrl(): string {
  return getBaseUrl();
}

export { getBaseUrl } from './client';
