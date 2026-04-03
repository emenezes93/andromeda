import { getRecentCheckIns, type DailyCheckInEntry } from '../storage/dailyCheckins';
import { getWorkoutLogs } from '../storage/workoutLogs';
import { getMealsForDate } from '../storage/mealLogs';
import { getWaterForDate, getWaterGoalMl } from '../storage/waterLogs';

export type CoachFocus = 'training' | 'recovery' | 'nutrition';

export interface AdaptiveRecommendation {
  title: string;
  message: string;
  focus: CoachFocus;
  cta: string;
}

function average(list: number[]): number {
  if (list.length === 0) return 0;
  return list.reduce((a, b) => a + b, 0) / list.length;
}

function getRecentWorkoutCount(logs: Array<{ executedAt: string }>, days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Math.max(0, days - 1));
  const minDate = cutoff.toISOString().slice(0, 10);
  return logs.filter((l) => (l.executedAt || '').slice(0, 10) >= minDate).length;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildFromCheckins(checkins: DailyCheckInEntry[]): AdaptiveRecommendation | null {
  if (checkins.length === 0) return null;
  const energyAvg = average(checkins.map((c) => c.energy));
  const sorenessAvg = average(checkins.map((c) => c.soreness));
  const motivationAvg = average(checkins.map((c) => c.motivation));

  if (sorenessAvg >= 4 && energyAvg <= 3) {
    return {
      title: 'Coach adaptativo: foco em recuperação',
      message: 'Seu check-in recente indica fadiga alta. Hoje vale priorizar mobilidade e reduzir volume em 20%.',
      focus: 'recovery',
      cta: 'Abrir treino leve',
    };
  }

  if (motivationAvg <= 2.5) {
    return {
      title: 'Coach adaptativo: manter consistência',
      message: 'Motivação baixa detectada. Faça uma sessão curta de 15 minutos para manter o ritmo sem sobrecarga.',
      focus: 'training',
      cta: 'Treino rápido 15 min',
    };
  }

  return {
    title: 'Coach adaptativo: progressão',
    message: 'Check-ins positivos nesta semana. Se o treino estiver fluindo, avance carga com técnica e controle.',
    focus: 'training',
    cta: 'Abrir treinos',
  };
}

export async function getAdaptiveRecommendation(): Promise<AdaptiveRecommendation> {
  const [checkins, logs, waterGoal, waterToday, mealsToday] = await Promise.all([
    getRecentCheckIns(7),
    getWorkoutLogs(),
    getWaterGoalMl(),
    getWaterForDate(todayISO()),
    getMealsForDate(todayISO()),
  ]);

  const base = buildFromCheckins(checkins);
  if (base) return base;

  const workoutsThisWeek = getRecentWorkoutCount(logs, 7);
  if (workoutsThisWeek < 2) {
    return {
      title: 'Coach adaptativo: retomar rotina',
      message: 'Você treinou pouco nos últimos 7 dias. Uma sessão curta hoje já recoloca você em consistência.',
      focus: 'training',
      cta: 'Abrir treinos rápidos',
    };
  }

  if (waterGoal > 0 && waterToday < waterGoal * 0.6) {
    return {
      title: 'Coach adaptativo: hidratação',
      message: 'Seu consumo de água está abaixo do ideal hoje. Bater a meta melhora recuperação e disposição.',
      focus: 'nutrition',
      cta: 'Registrar água',
    };
  }

  const kcal = mealsToday.reduce((s, m) => s + (m.kcal ?? 0), 0);
  if (kcal === 0) {
    return {
      title: 'Coach adaptativo: nutrição em dia',
      message: 'Você ainda não registrou refeições hoje. Faça um registro rápido para fechar o ciclo treino + dieta.',
      focus: 'nutrition',
      cta: 'Abrir diário',
    };
  }

  return {
    title: 'Coach adaptativo: semana consistente',
    message: 'Ótimo ritmo. Mantenha o plano atual e consolide mais uma semana com registros completos.',
    focus: 'training',
    cta: 'Ver progresso',
  };
}
