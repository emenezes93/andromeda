import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@patient_app_water_reminder_times';

const DEFAULT_TIMES = ['08:00', '12:00', '18:00'];

export async function getWaterReminderTimes(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [...DEFAULT_TIMES];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : [...DEFAULT_TIMES];
  } catch {
    return [...DEFAULT_TIMES];
  }
}

export async function setWaterReminderTimes(times: string[]): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(times));
}
