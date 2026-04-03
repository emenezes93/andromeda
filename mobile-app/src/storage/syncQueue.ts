/**
 * Fila de sincronização local (F5.1). Itens criados localmente são enfileirados e enviados ao backend quando há conexão.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@patient_app_sync_queue';

export type SyncItemType = 'weight' | 'water' | 'meal' | 'bodyMeasurement' | 'progressPhoto' | 'healthMetrics';

export interface SyncQueueItem {
  id: string;
  type: SyncItemType;
  payload: Record<string, unknown>;
  createdAt: string;
}

export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SyncQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function enqueueSync(type: SyncItemType, payload: Record<string, unknown>): Promise<void> {
  const queue = await getSyncQueue();
  const id = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  queue.push({
    id,
    type,
    payload,
    createdAt: new Date().toISOString(),
  });
  await AsyncStorage.setItem(KEY, JSON.stringify(queue));
}

export async function removeSyncItem(id: string): Promise<void> {
  const queue = await getSyncQueue();
  const next = queue.filter((i) => i.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function getPendingSyncCount(): Promise<number> {
  const queue = await getSyncQueue();
  return queue.length;
}
