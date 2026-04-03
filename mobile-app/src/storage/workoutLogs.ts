import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SavedWorkoutLog, WorkoutSetRecord, WorkoutExerciseLog } from '../types';

const KEY = '@patient_app_workout_logs';

export async function getWorkoutLogs(): Promise<SavedWorkoutLog[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedWorkoutLog[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveWorkoutLog(entry: SavedWorkoutLog): Promise<void> {
  const logs = await getWorkoutLogs();
  logs.unshift(entry);
  await AsyncStorage.setItem(KEY, JSON.stringify(logs));
}

/** Último treino salvo do mesmo plano (para comparativo de carga e volume). */
export async function getLastWorkoutLogForPlan(planId: string): Promise<SavedWorkoutLog | null> {
  const logs = await getWorkoutLogs();
  return logs.find((l) => l.planId === planId) ?? null;
}

/** Últimos 2 treinos do mesmo plano (para sugestão de progressão F4.2). */
export async function getLastTwoWorkoutLogsForPlan(planId: string): Promise<SavedWorkoutLog[]> {
  const logs = await getWorkoutLogs();
  return logs.filter((l) => l.planId === planId).slice(0, 2);
}

const norm = (s: string) => s.trim().toLowerCase();

function parseMinReps(repsStr?: string): number {
  if (!repsStr || !repsStr.trim()) return 0;
  const part = repsStr.trim().split(/-|–|,/)[0];
  const n = parseInt(part, 10);
  return isNaN(n) ? 0 : n;
}

/** Retorna sugestão de progressão por exercício (nome normalizado): aumentar +2,5 kg se 100% séries/reps nas últimas 2 sessões; reduzir 5% se 0 séries completas na última. */
export function getProgressionSuggestions(
  lastTwoLogs: SavedWorkoutLog[],
  currentExerciseNames: string[],
  suggestedMinReps: (name: string) => number
): Map<string, { type: 'increase' | 'decrease'; suggestedWeightKg: number; message: string }> {
  const result = new Map<string, { type: 'increase' | 'decrease'; suggestedWeightKg: number; message: string }>();
  if (lastTwoLogs.length === 0) return result;
  const lastLog = lastTwoLogs[0];

  for (const exerciseName of currentExerciseNames) {
    const name = norm(exerciseName);
    const logEx = lastLog.exercises.find((e) => norm(e.exerciseName) === name);
    if (!logEx) continue;
    const sets = logEx.sets as WorkoutSetRecord[];
    const completedCount = sets.filter((s) => s.completed && (s.reps ?? 0) > 0).length;
    const totalSets = sets.length;
    const lastWeight = sets.reduce((max, s) => Math.max(max, s.weightKg ?? 0), 0);

    if (totalSets > 0 && completedCount === 0 && lastWeight > 0) {
      const suggested = Math.max(1, Math.round(lastWeight * 0.95 * 2) / 2);
      result.set(name, {
        type: 'decrease',
        suggestedWeightKg: suggested,
        message: 'Tente reduzir 5% e focar na técnica esta sessão.',
      });
      continue;
    }

    if (lastTwoLogs.length < 2 || lastWeight <= 0) continue;
    const minReps = suggestedMinReps(name);
    let allCompleteInBoth = true;
    for (const log of lastTwoLogs) {
      const ex = log.exercises.find((e) => norm(e.exerciseName) === name);
      if (!ex) {
        allCompleteInBoth = false;
        break;
      }
      const logSets = ex.sets as WorkoutSetRecord[];
      const allDone = logSets.every((s) => s.completed && (s.reps ?? 0) >= minReps);
      if (!allDone) {
        allCompleteInBoth = false;
        break;
      }
    }
    if (allCompleteInBoth) {
      const suggested = lastWeight + 2.5;
      result.set(name, {
        type: 'increase',
        suggestedWeightKg: suggested,
        message: `Que tal tentar ${suggested} kg hoje? (+2,5 kg)`,
      });
    }
  }
  return result;
}

export { parseMinReps };

/** Carga da última sessão por nome do exercício: melhor série (peso × reps). */
export function getLastSessionLoadByExercise(log: SavedWorkoutLog | null): Map<string, { weightKg: number; reps: number }> {
  const map = new Map<string, { weightKg: number; reps: number }>();
  if (!log) return map;
  const norm = (s: string) => s.trim().toLowerCase();
  for (const ex of log.exercises) {
    const name = norm(ex.exerciseName);
    let bestVolume = 0;
    let best: { weightKg: number; reps: number } | null = null;
    for (const set of ex.sets as WorkoutSetRecord[]) {
      const w = set.weightKg ?? 0;
      const r = set.reps ?? 0;
      const vol = w * r;
      if (vol > bestVolume && w > 0 && r > 0) {
        bestVolume = vol;
        best = { weightKg: w, reps: r };
      }
    }
    if (best) map.set(name, best);
  }
  return map;
}

/** Volume total da sessão: Σ (peso × reps) em kg. */
export function computeVolumeFromLog(exercises: WorkoutExerciseLog[]): number {
  let v = 0;
  for (const ex of exercises) {
    for (const set of ex.sets as WorkoutSetRecord[]) {
      const w = set.weightKg ?? 0;
      const r = set.reps ?? 0;
      v += w * r;
    }
  }
  return v;
}

/** 1RM estimado por exercício (Epley: peso × (1 + reps/30)), máximo por exercício. */
export function computeE1rmFromLog(exercises: WorkoutExerciseLog[]): { name: string; e1rm: number }[] {
  const result: { name: string; e1rm: number }[] = [];
  for (const ex of exercises) {
    let maxE1rm = 0;
    for (const set of ex.sets as WorkoutSetRecord[]) {
      const w = set.weightKg ?? 0;
      const r = set.reps ?? 0;
      if (w > 0 && r > 0) {
        const e1rm = w * (1 + r / 30);
        if (e1rm > maxE1rm) maxE1rm = e1rm;
      }
    }
    if (maxE1rm > 0) result.push({ name: ex.exerciseName, e1rm: Math.round(maxE1rm * 10) / 10 });
  }
  return result;
}
