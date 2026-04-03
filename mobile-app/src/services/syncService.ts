/**
 * Serviço de sincronização (F5.1). Envia itens da fila local para o backend quando há conexão.
 */
import { getSyncQueue, removeSyncItem } from '../storage/syncQueue';
import {
  postWeightLog,
  postWaterLog,
  postMealLog,
  postBodyMeasurement,
  postProgressPhoto,
  postHealthMetrics,
} from '../api/progressApi';
import type { WeightEntry } from '../types';
import type { MealLogEntry } from '../types';
import type { BodyMeasurementEntry } from '../types';
import type { ProgressPhoto } from '../types';
import type { HealthMetricsEntry } from '../types';

export interface SyncResult {
  synced: number;
  failed: number;
}

export async function runSync(token: string, tenantId: string): Promise<SyncResult> {
  const queue = await getSyncQueue();
  let synced = 0;
  let failed = 0;

  for (const item of queue) {
    try {
      switch (item.type) {
        case 'weight':
          await postWeightLog(item.payload as unknown as WeightEntry, token, tenantId);
          break;
        case 'water':
          await postWaterLog(item.payload as { date: string; ml: number }, token, tenantId);
          break;
        case 'meal':
          await postMealLog(item.payload as unknown as MealLogEntry, token, tenantId);
          break;
        case 'bodyMeasurement':
          await postBodyMeasurement(item.payload as unknown as BodyMeasurementEntry, token, tenantId);
          break;
        case 'progressPhoto':
          await postProgressPhoto(item.payload as unknown as ProgressPhoto, token, tenantId);
          break;
        case 'healthMetrics':
          await postHealthMetrics(item.payload as unknown as HealthMetricsEntry, token, tenantId);
          break;
        default:
          failed++;
          continue;
      }
      await removeSyncItem(item.id);
      synced++;
    } catch (error) {
      const err = error as Error & { status?: number };
      const status = err.status;
      console.warn(`[sync] Failed to sync ${item.type}:`, err.message);

      // Duplicado: tratar como sucesso.
      if (status === 409) {
        await removeSyncItem(item.id);
        synced++;
        continue;
      }

      // Payload inválido: remover para evitar retry infinito.
      if (status === 400) {
        await removeSyncItem(item.id);
        failed++;
        continue;
      }

      // Falhas de rede ou 5xx: manter item para tentar depois.
      if (status == null || status >= 500) {
        failed++;
        continue;
      }

      // Demais códigos 4xx: não bloquear fila.
      await removeSyncItem(item.id);
      failed++;
    }
  }

  return { synced, failed };
}
