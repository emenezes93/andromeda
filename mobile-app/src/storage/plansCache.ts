/**
 * F6.4 — Cache de planos (treino e dieta) para uso offline.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TrainingPlanDetail } from '../types';
import type { DietPlanDetail } from '../types';
import type { TrainingPlansResponse } from '../api/training';
import type { DietPlansResponse } from '../api/diet';

const PREFIX = '@patient_app_plans_cache_';
const KEY_TRAINING_LIST = PREFIX + 'training_list';
const KEY_TRAINING_PLAN = (id: string) => PREFIX + 'training_plan_' + id;
const KEY_DIET_LIST = PREFIX + 'diet_list';
const KEY_DIET_PLAN = (id: string) => PREFIX + 'diet_plan_' + id;

export async function getCachedTrainingPlans(): Promise<TrainingPlansResponse | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_TRAINING_LIST);
    if (!raw) return null;
    return JSON.parse(raw) as TrainingPlansResponse;
  } catch {
    return null;
  }
}

export async function setCachedTrainingPlans(data: TrainingPlansResponse): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_TRAINING_LIST, JSON.stringify(data));
  } catch {}
}

export async function getCachedTrainingPlan(id: string): Promise<TrainingPlanDetail | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_TRAINING_PLAN(id));
    if (!raw) return null;
    return JSON.parse(raw) as TrainingPlanDetail;
  } catch {
    return null;
  }
}

export async function setCachedTrainingPlan(id: string, data: TrainingPlanDetail): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_TRAINING_PLAN(id), JSON.stringify(data));
  } catch {}
}

export async function getCachedDietPlans(): Promise<DietPlansResponse | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_DIET_LIST);
    if (!raw) return null;
    return JSON.parse(raw) as DietPlansResponse;
  } catch {
    return null;
  }
}

export async function setCachedDietPlans(data: DietPlansResponse): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_DIET_LIST, JSON.stringify(data));
  } catch {}
}

export async function getCachedDietPlan(id: string): Promise<DietPlanDetail | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY_DIET_PLAN(id));
    if (!raw) return null;
    return JSON.parse(raw) as DietPlanDetail;
  } catch {
    return null;
  }
}

export async function setCachedDietPlan(id: string, data: DietPlanDetail): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_DIET_PLAN(id), JSON.stringify(data));
  } catch {}
}
