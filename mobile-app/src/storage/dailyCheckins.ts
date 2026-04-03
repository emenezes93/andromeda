import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DailyCheckInEntry {
  id: string;
  date: string; // YYYY-MM-DD
  energy: 1 | 2 | 3 | 4 | 5;
  soreness: 1 | 2 | 3 | 4 | 5;
  motivation: 1 | 2 | 3 | 4 | 5;
}

const KEY = '@patient_app_daily_checkins';

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyCheckIns(): Promise<DailyCheckInEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DailyCheckInEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveDailyCheckIn(entry: DailyCheckInEntry): Promise<void> {
  const list = await getDailyCheckIns();
  const next = [entry, ...list.filter((i) => i.date !== entry.date)].sort((a, b) => b.date.localeCompare(a.date));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function getCheckInForDate(date: string): Promise<DailyCheckInEntry | null> {
  const list = await getDailyCheckIns();
  return list.find((i) => i.date === date) ?? null;
}

export async function getRecentCheckIns(days = 7): Promise<DailyCheckInEntry[]> {
  const list = await getDailyCheckIns();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Math.max(0, days - 1));
  const start = cutoff.toISOString().slice(0, 10);
  return list.filter((i) => i.date >= start).sort((a, b) => a.date.localeCompare(b.date));
}
