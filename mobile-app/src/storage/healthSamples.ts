import AsyncStorage from '@react-native-async-storage/async-storage';
import type { HealthMetricsEntry } from '../types';

const KEY = '@patient_app_health_samples';

export async function getHealthSamples(): Promise<HealthMetricsEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HealthMetricsEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveHealthSample(entry: HealthMetricsEntry): Promise<void> {
  const list = await getHealthSamples();
  const next = [entry, ...list].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 180);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
