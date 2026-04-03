import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WeightEntry } from '../types';
import { enqueueSync } from './syncQueue';

const KEY = '@patient_app_weight_logs';

export async function getWeightLogs(): Promise<WeightEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WeightEntry[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.date.localeCompare(a.date)) : [];
  } catch {
    return [];
  }
}

export async function saveWeightEntry(entry: WeightEntry): Promise<void> {
  const logs = await getWeightLogs();
  const without = logs.filter((e) => e.id !== entry.id);
  without.unshift(entry);
  without.sort((a, b) => b.date.localeCompare(a.date));
  await AsyncStorage.setItem(KEY, JSON.stringify(without));
  await enqueueSync('weight', entry as unknown as Record<string, unknown>);
}

export async function deleteWeightEntry(id: string): Promise<void> {
  const logs = await getWeightLogs();
  const filtered = logs.filter((e) => e.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
}
