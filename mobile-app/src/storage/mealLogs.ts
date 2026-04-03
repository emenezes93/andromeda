import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MealLogEntry } from '../types';
import { enqueueSync } from './syncQueue';

const KEY = '@patient_app_meal_logs';

export async function getMealLogs(): Promise<MealLogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as MealLogEntry[];
    return Array.isArray(parsed) ? parsed.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time)) : [];
  } catch {
    return [];
  }
}

export async function getMealsForDate(date: string): Promise<MealLogEntry[]> {
  const logs = await getMealLogs();
  return logs.filter((e) => e.date === date).sort((a, b) => a.time.localeCompare(b.time));
}

export async function saveMealEntry(entry: MealLogEntry): Promise<void> {
  const logs = await getMealLogs();
  const without = logs.filter((e) => e.id !== entry.id);
  without.push(entry);
  without.sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time));
  await AsyncStorage.setItem(KEY, JSON.stringify(without));
  await enqueueSync('meal', entry as unknown as Record<string, unknown>);
}

export async function deleteMealEntry(id: string): Promise<void> {
  const logs = await getMealLogs();
  const filtered = logs.filter((e) => e.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
}
