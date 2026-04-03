/**
 * API de progresso do paciente (F5.1). Endpoints para enviar dados locais ao backend Andromeda.
 * Quando o backend não existir ou retornar 404/501, o sync falha e os itens permanecem na fila.
 */
import { apiFetch } from './client';
import { isDevToken } from './andromeda';
import type { WeightEntry } from '../types';
import type { MealLogEntry } from '../types';
import type { BodyMeasurementEntry } from '../types';
import type { ProgressPhoto } from '../types';
import type { HealthMetricsEntry } from '../types';

export interface WaterLogPayload {
  date: string;
  ml: number;
}

function hasBackend(token: string): boolean {
  return !isDevToken(token);
}

export async function postWeightLog(
  entry: WeightEntry,
  token: string,
  tenantId: string
): Promise<void> {
  if (!hasBackend(token)) return;
  await apiFetch('/v1/patient-portal/my-weight-logs', {
    method: 'POST',
    token,
    tenantId,
    body: JSON.stringify({
      date: entry.date,
      valueKg: entry.valueKg,
    }),
  });
}

export async function postWaterLog(
  payload: WaterLogPayload,
  token: string,
  tenantId: string
): Promise<void> {
  if (!hasBackend(token)) return;
  await apiFetch('/v1/patient-portal/my-water-logs', {
    method: 'POST',
    token,
    tenantId,
    body: JSON.stringify(payload),
  });
}

export async function postMealLog(
  entry: MealLogEntry,
  token: string,
  tenantId: string
): Promise<void> {
  if (!hasBackend(token)) return;
  await apiFetch('/v1/patient-portal/my-meal-logs', {
    method: 'POST',
    token,
    tenantId,
    body: JSON.stringify({
      date: entry.date,
      time: entry.time,
      name: entry.name,
      kcal: entry.kcal ?? null,
      proteinG: entry.proteinG ?? null,
      carbsG: entry.carbsG ?? null,
      fatG: entry.fatG ?? null,
    }),
  });
}

export async function postBodyMeasurement(
  entry: BodyMeasurementEntry,
  token: string,
  tenantId: string
): Promise<void> {
  if (!hasBackend(token)) return;
  const fullPayload = {
    date: entry.date,
    waistCm: entry.waistCm ?? null,
    hipCm: entry.hipCm ?? null,
    chestCm: entry.chestCm ?? null,
    armLeftCm: entry.armLeftCm ?? null,
    armRightCm: entry.armRightCm ?? null,
    thighLeftCm: entry.thighLeftCm ?? null,
    thighRightCm: entry.thighRightCm ?? null,
    neckCm: entry.neckCm ?? null,
  };
  try {
    await apiFetch('/v1/patient-portal/my-body-measurements', {
      method: 'POST',
      token,
      tenantId,
      body: JSON.stringify(fullPayload),
    });
  } catch (error) {
    const status = (error as Error & { status?: number }).status;
    // Fallback para backend com schema reduzido.
    if (status === 400) {
      await apiFetch('/v1/patient-portal/my-body-measurements', {
        method: 'POST',
        token,
        tenantId,
        body: JSON.stringify({
          date: entry.date,
          waistCm: entry.waistCm ?? null,
          hipCm: entry.hipCm ?? null,
        }),
      });
      return;
    }
    throw error;
  }
}

/** Envia metadados da foto (backend pode esperar upload separado ou base64). */
export async function postProgressPhoto(
  entry: ProgressPhoto,
  token: string,
  tenantId: string
): Promise<void> {
  if (!hasBackend(token)) return;
  const isLocalFile = /^(file|content):\/\//i.test(entry.uri);
  if (isLocalFile) {
    const fileName = `progress-${Date.now()}.jpg`;
    const form = new FormData();
    form.append('date', entry.date);
    if (entry.angle) form.append('angle', entry.angle);
    form.append(
      'file',
      {
        uri: entry.uri,
        name: fileName,
        type: 'image/jpeg',
      } as unknown as Blob
    );
    await apiFetch('/v1/patient-portal/my-progress-photos', {
      method: 'POST',
      token,
      tenantId,
      body: form,
    });
    return;
  }
  await apiFetch('/v1/patient-portal/my-progress-photos', {
    method: 'POST',
    token,
    tenantId,
    body: JSON.stringify({
      date: entry.date,
      angle: entry.angle ?? null,
      uri: entry.uri,
    }),
  });
}

/** Envia métricas de integração health (passos/atividade/sono). */
export async function postHealthMetrics(
  entry: HealthMetricsEntry,
  token: string,
  tenantId: string
): Promise<void> {
  if (!hasBackend(token)) return;
  await apiFetch('/v1/patient-portal/my-health-metrics', {
    method: 'POST',
    token,
    tenantId,
    body: JSON.stringify({
      provider: entry.provider,
      date: entry.date,
      steps: entry.steps ?? null,
      activeMinutes: entry.activeMinutes ?? null,
      sleepMinutes: entry.sleepMinutes ?? null,
      source: entry.source,
    }),
  });
}
