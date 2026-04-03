import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProgressPhoto } from '../types';
import { enqueueSync } from './syncQueue';

const KEY = '@patient_app_progress_photos';

export async function getProgressPhotos(): Promise<ProgressPhoto[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ProgressPhoto[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.date.localeCompare(a.date)) : [];
  } catch {
    return [];
  }
}

export async function saveProgressPhoto(entry: ProgressPhoto): Promise<void> {
  const list = await getProgressPhotos();
  list.unshift(entry);
  list.sort((a, b) => b.date.localeCompare(a.date));
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
  await enqueueSync('progressPhoto', entry as unknown as Record<string, unknown>);
}

export async function deleteProgressPhoto(id: string): Promise<void> {
  const list = await getProgressPhotos();
  const filtered = list.filter((p) => p.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
}
