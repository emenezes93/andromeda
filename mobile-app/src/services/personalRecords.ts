import { getWorkoutLogs } from '../storage/workoutLogs';
import type { SavedWorkoutLog, WorkoutSetRecord } from '../types';

export interface PersonalRecord {
  exerciseName: string;
  maxWeightKg: number | null;
  maxReps: number | null;
  /** Ex: "80 kg × 8 reps" for display */
  displayText: string;
}

function normalizeExerciseName(name: string): string {
  return name.trim().toLowerCase();
}

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const logs = await getWorkoutLogs();
  const byName = new Map<string, { maxKg: number; maxReps: number }>();

  for (const log of logs) {
    for (const ex of log.exercises) {
      const key = normalizeExerciseName(ex.exerciseName);
      let cur = byName.get(key);
      if (!cur) {
        cur = { maxKg: 0, maxReps: 0 };
        byName.set(key, cur);
      }
      for (const set of ex.sets as WorkoutSetRecord[]) {
        if (set.weightKg != null && set.weightKg > cur.maxKg) cur.maxKg = set.weightKg;
        if (set.reps != null && set.reps > cur.maxReps) cur.maxReps = set.reps;
      }
    }
  }

  const result: PersonalRecord[] = [];
  const seenNames = new Set<string>();
  for (const log of logs) {
    for (const ex of log.exercises) {
      const key = normalizeExerciseName(ex.exerciseName);
      if (seenNames.has(key)) continue;
      seenNames.add(key);
      const cur = byName.get(key)!;
      const maxKg = cur.maxKg > 0 ? cur.maxKg : null;
      const maxReps = cur.maxReps > 0 ? cur.maxReps : null;
      const parts: string[] = [];
      if (maxKg != null) parts.push(`${maxKg} kg`);
      if (maxReps != null) parts.push(`${maxReps} reps`);
      result.push({
        exerciseName: ex.exerciseName,
        maxWeightKg: maxKg,
        maxReps: maxReps,
        displayText: parts.length ? parts.join(' × ') : '—',
      });
    }
  }
  return result;
}

export function getPersonalRecordForExercise(
  records: PersonalRecord[],
  exerciseName: string
): PersonalRecord | undefined {
  const key = normalizeExerciseName(exerciseName);
  return records.find((r) => normalizeExerciseName(r.exerciseName) === key);
}
