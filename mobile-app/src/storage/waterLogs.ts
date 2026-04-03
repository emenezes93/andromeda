import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WaterEntry } from '../types';
import { enqueueSync } from './syncQueue';

const KEY = '@patient_app_water_logs';

export async function getWaterLogs(): Promise<WaterEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as WaterEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getWaterForDate(date: string): Promise<number> {
  const logs = await getWaterLogs();
  const entry = logs.find((e) => e.date === date);
  return entry?.ml ?? 0;
}

export async function addWaterForDate(date: string, mlToAdd: number): Promise<number> {
  const logs = await getWaterLogs();
  const idx = logs.findIndex((e) => e.date === date);
  const current = idx >= 0 ? logs[idx].ml : 0;
  const newTotal = current + mlToAdd;
  if (idx >= 0) logs[idx].ml = newTotal;
  else logs.push({ date, ml: newTotal });
  logs.sort((a, b) => b.date.localeCompare(a.date));
  await AsyncStorage.setItem(KEY, JSON.stringify(logs));
  await enqueueSync('water', { date, ml: newTotal });
  return newTotal;
}

export async function setWaterForDate(date: string, ml: number): Promise<void> {
  const logs = await getWaterLogs();
  const idx = logs.findIndex((e) => e.date === date);
  if (idx >= 0) logs[idx].ml = ml;
  else logs.push({ date, ml });
  logs.sort((a, b) => b.date.localeCompare(a.date));
  await AsyncStorage.setItem(KEY, JSON.stringify(logs));
  await enqueueSync('water', { date, ml });
}

const DEFAULT_GOAL_ML = 2500;
const GOAL_KEY = '@patient_app_water_goal_ml';

export async function getWaterGoalMl(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(GOAL_KEY);
    if (!raw) return DEFAULT_GOAL_ML;
    const n = parseInt(raw, 10);
    return isNaN(n) || n < 0 ? DEFAULT_GOAL_ML : n;
  } catch {
    return DEFAULT_GOAL_ML;
  }
}

export async function setWaterGoalMl(ml: number): Promise<void> {
  await AsyncStorage.setItem(GOAL_KEY, String(ml));
}
