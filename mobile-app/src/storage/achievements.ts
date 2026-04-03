import AsyncStorage from '@react-native-async-storage/async-storage';
import { getWorkoutLogs } from './workoutLogs';
import { getWaterLogs } from './waterLogs';
import { getWaterGoalMl } from './waterLogs';
import { getWeightLogs } from './weightLogs';
import { getMealLogs } from './mealLogs';

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  unlockedAt: string | null;
}

export interface StreakInfo {
  type: 'workout' | 'water' | 'global';
  label: string;
  currentCount: number;
  lastDate: string | null;
}

const BADGE_DEFS: Omit<Badge, 'unlockedAt'>[] = [
  { id: 'first_workout', name: 'Primeiro treino', description: 'Ao completar 1ª sessão', iconName: 'star' },
  { id: 'workouts_5', name: 'Consistência 5', description: '5 treinos realizados', iconName: 'barbell' },
  { id: 'workouts_10', name: 'Consistência 10', description: '10 treinos realizados', iconName: 'barbell' },
  { id: 'workouts_25', name: 'Consistência 25', description: '25 treinos realizados', iconName: 'flame' },
  { id: 'workouts_50', name: 'Consistência 50', description: '50 treinos realizados', iconName: 'flame' },
  { id: 'workouts_100', name: 'Consistência 100', description: '100 treinos realizados', iconName: 'trophy' },
  { id: 'week_perfect', name: 'Semana perfeita', description: '3+ treinos em uma semana', iconName: 'calendar' },
  { id: 'marathon', name: 'Maratonista', description: 'Treino com mais de 90 minutos', iconName: 'time' },
  { id: 'water_7', name: 'Hidratado', description: 'Meta de água 7 dias seguidos', iconName: 'water' },
  { id: 'water_30', name: 'Hidratado 30', description: 'Meta de água 30 dias seguidos', iconName: 'trophy' },
  { id: 'diet_5', name: 'Na dieta', description: 'Meta de kcal respeitada 5 dias seguidos', iconName: 'nutrition' },
  { id: 'protein_3', name: 'Proteína em dia', description: 'Meta de proteína 3 dias seguidos', iconName: 'restaurant' },
  { id: 'weight_5', name: 'Evolução real', description: '5 registros de peso', iconName: 'trending-down' },
  { id: 'before_after', name: 'Antes e depois', description: 'Primeira comparação de fotos', iconName: 'camera' },
];

function getMonthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}

function getWeekKey(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00');
  const start = new Date(d);
  start.setDate(d.getDate() - d.getDay());
  return start.toISOString().slice(0, 10);
}

export async function getWorkoutCountByMonth(): Promise<Record<string, number>> {
  const logs = await getWorkoutLogs();
  const byMonth: Record<string, number> = {};
  for (const log of logs) {
    const month = getMonthKey(log.executedAt);
    byMonth[month] = (byMonth[month] ?? 0) + 1;
  }
  return byMonth;
}

export async function getWaterStreak(): Promise<{ count: number; lastDate: string | null }> {
  const entries = await getWaterLogs();
  const goal = await getWaterGoalMl();
  const byDate = new Map<string, number>();
  for (const e of entries) {
    byDate.set(e.date, e.ml);
  }
  const sortedDates = Array.from(byDate.keys()).sort();
  let count = 0;
  let lastDate: string | null = null;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = sortedDates.length - 1; i >= 0; i--) {
    const d = sortedDates[i];
    if (d > today) continue;
    const ml = byDate.get(d) ?? 0;
    if (ml >= goal) {
      if (lastDate === null) {
        count = 1;
        lastDate = d;
      } else {
        const dayDiff = (new Date(lastDate).getTime() - new Date(d).getTime()) / 86400000;
        if (dayDiff >= 1 && dayDiff <= 1.5) {
          count++;
          lastDate = d;
        } else break;
      }
    } else break;
  }
  return { count, lastDate };
}

export async function getWorkoutStreak(): Promise<{ count: number; lastDate: string | null }> {
  const logs = await getWorkoutLogs();
  const dates = [...new Set(logs.map((l) => l.executedAt.slice(0, 10)))].sort();
  let count = 0;
  let lastDate: string | null = null;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = dates.length - 1; i >= 0; i--) {
    const d = dates[i];
    if (d > today) continue;
    if (lastDate === null) {
      count = 1;
      lastDate = d;
      continue;
    }
    const diff = (new Date(lastDate).getTime() - new Date(d).getTime()) / 86400000;
    if (diff <= 1) {
      count++;
      lastDate = d;
    } else break;
  }
  return { count, lastDate };
}

/** Streak global: dias consecutivos com pelo menos um log (treino, refeição, água ou peso). */
export async function getGlobalStreak(): Promise<{ count: number; lastDate: string | null }> {
  const [workoutLogs, mealLogs, waterLogs, weightLogs] = await Promise.all([
    getWorkoutLogs(),
    getMealLogs(),
    getWaterLogs(),
    getWeightLogs(),
  ]);
  const workoutDates = new Set(workoutLogs.map((l) => l.executedAt.slice(0, 10)));
  const mealDates = new Set(mealLogs.map((m) => m.date));
  const waterDates = new Set(waterLogs.map((w) => w.date));
  const weightDates = new Set(weightLogs.map((w) => w.date));
  const allDates = new Set<string>([...workoutDates, ...mealDates, ...waterDates, ...weightDates]);
  const sorted = Array.from(allDates).sort();
  let count = 0;
  let lastDate: string | null = null;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = sorted.length - 1; i >= 0; i--) {
    const d = sorted[i];
    if (d > today) continue;
    if (lastDate === null) {
      count = 1;
      lastDate = d;
      continue;
    }
    const diff = (new Date(lastDate).getTime() - new Date(d).getTime()) / 86400000;
    if (diff <= 1) {
      count++;
      lastDate = d;
    } else break;
  }
  return { count, lastDate };
}

export async function getStreaks(): Promise<StreakInfo[]> {
  const [workout, water, global] = await Promise.all([getWorkoutStreak(), getWaterStreak(), getGlobalStreak()]);
  return [
    { type: 'global', label: 'Sequência de dias (qualquer log)', currentCount: global.count, lastDate: global.lastDate },
    { type: 'workout', label: 'Treinos consecutivos (dias)', currentCount: workout.count, lastDate: workout.lastDate },
    { type: 'water', label: 'Meta de água (dias seguidos)', currentCount: water.count, lastDate: water.lastDate },
  ];
}

async function getMealStreak(): Promise<{ count: number; lastDate: string | null }> {
  const meals = await getMealLogs();
  const byDate = new Set(meals.map((m) => m.date));
  const sorted = Array.from(byDate).sort();
  let count = 0;
  let lastDate: string | null = null;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = sorted.length - 1; i >= 0; i--) {
    const d = sorted[i];
    if (d > today) continue;
    if (lastDate === null) {
      count = 1;
      lastDate = d;
      continue;
    }
    const diff = (new Date(lastDate).getTime() - new Date(d).getTime()) / 86400000;
    if (diff <= 1) {
      count++;
      lastDate = d;
    } else break;
  }
  return { count, lastDate };
}

async function getProteinStreak(): Promise<{ count: number; lastDate: string | null }> {
  const meals = await getMealLogs();
  const byDate = new Map<string, boolean>();
  for (const m of meals) {
    if ((m.proteinG ?? 0) > 0) byDate.set(m.date, true);
  }
  const sorted = Array.from(byDate.keys()).sort();
  let count = 0;
  let lastDate: string | null = null;
  const today = new Date().toISOString().slice(0, 10);
  for (let i = sorted.length - 1; i >= 0; i--) {
    const d = sorted[i];
    if (d > today) continue;
    if (lastDate === null) {
      count = 1;
      lastDate = d;
      continue;
    }
    const diff = (new Date(lastDate).getTime() - new Date(d).getTime()) / 86400000;
    if (diff <= 1) {
      count++;
      lastDate = d;
    } else break;
  }
  return { count, lastDate };
}

const BEFORE_AFTER_KEY = '@patient_app_photo_compare_used';

export async function setPhotoCompareUsed(): Promise<void> {
  await AsyncStorage.setItem(BEFORE_AFTER_KEY, '1');
}

export async function hasUsedPhotoCompare(): Promise<boolean> {
  return (await AsyncStorage.getItem(BEFORE_AFTER_KEY)) === '1';
}

export async function getBadges(): Promise<Badge[]> {
  const [byMonth, waterStreak, logs, weightLogs, mealStreak, proteinStreak, photoUsed] = await Promise.all([
    getWorkoutCountByMonth(),
    getWaterStreak(),
    getWorkoutLogs(),
    getWeightLogs(),
    getMealStreak(),
    getProteinStreak(),
    hasUsedPhotoCompare(),
  ]);
  const workoutCount = logs.length;
  const byWeek: Record<string, number> = {};
  for (const log of logs) {
    const wk = getWeekKey(log.executedAt);
    byWeek[wk] = (byWeek[wk] ?? 0) + 1;
  }
  const maxWorkoutsInWeek = Math.max(0, ...Object.values(byWeek));
  const hasMarathon = logs.some((l) => (l.durationMinutes ?? 0) >= 90);
  const badges: Badge[] = BADGE_DEFS.map((b) => ({ ...b, unlockedAt: null }));
  const now = new Date().toISOString().slice(0, 10);

  const setUnlock = (id: string, date: string) => {
    const idx = badges.findIndex((b) => b.id === id);
    if (idx >= 0 && !badges[idx].unlockedAt) badges[idx].unlockedAt = date;
  };
  if (workoutCount >= 1) setUnlock('first_workout', now);
  if (workoutCount >= 5) setUnlock('workouts_5', now);
  if (workoutCount >= 10) setUnlock('workouts_10', now);
  if (workoutCount >= 25) setUnlock('workouts_25', now);
  if (workoutCount >= 50) setUnlock('workouts_50', now);
  if (workoutCount >= 100) setUnlock('workouts_100', now);
  if (maxWorkoutsInWeek >= 3) setUnlock('week_perfect', now);
  if (hasMarathon) setUnlock('marathon', now);
  if (waterStreak.count >= 7) setUnlock('water_7', waterStreak.lastDate ?? now);
  if (waterStreak.count >= 30) setUnlock('water_30', waterStreak.lastDate ?? now);
  if (mealStreak.count >= 5) setUnlock('diet_5', mealStreak.lastDate ?? now);
  if (proteinStreak.count >= 3) setUnlock('protein_3', proteinStreak.lastDate ?? now);
  if (weightLogs.length >= 5) setUnlock('weight_5', now);
  if (photoUsed) setUnlock('before_after', now);
  return badges;
}
