import AsyncStorage from '@react-native-async-storage/async-storage';
import type { BodyMeasurementEntry } from '../types';
import { enqueueSync } from './syncQueue';

const KEY = '@patient_app_body_measurements';

export async function getBodyMeasurements(): Promise<BodyMeasurementEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as BodyMeasurementEntry[];
    return Array.isArray(parsed)
      ? parsed.sort((a, b) => b.date.localeCompare(a.date))
      : [];
  } catch {
    return [];
  }
}

export async function saveBodyMeasurement(entry: BodyMeasurementEntry): Promise<void> {
  const list = await getBodyMeasurements();
  const without = list.filter((e) => e.id !== entry.id);
  without.unshift(entry);
  without.sort((a, b) => b.date.localeCompare(a.date));
  await AsyncStorage.setItem(KEY, JSON.stringify(without));
  await enqueueSync('bodyMeasurement', entry as unknown as Record<string, unknown>);
}

export async function deleteBodyMeasurement(id: string): Promise<void> {
  const list = await getBodyMeasurements();
  const filtered = list.filter((e) => e.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
}
