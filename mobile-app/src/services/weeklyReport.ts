/**
 * Dados do relatório semanal e agendamento da notificação "Resumo da semana".
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { getWorkoutLogs, computeVolumeFromLog } from '../storage/workoutLogs';
import { getWaterLogs, getWaterGoalMl } from '../storage/waterLogs';
import { getWeightLogs } from '../storage/weightLogs';

const WEEKLY_REPORT_CHANNEL_ID = 'weekly_report';

export interface WeeklyReportData {
  weekStart: string;
  weekEnd: string;
  workoutsCount: number;
  volumeTotalKg: number;
  waterAvgPct: number;
  weightChangeKg: number | null;
  motivationalPhrase: string;
}

function getWeekRange(): { start: string; end: string } {
  const now = new Date();
  const end = new Date(now);
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

function getMotivationalPhrase(workoutsCount: number, volumeTotalKg: number, waterPct: number): string {
  if (workoutsCount >= 4 && waterPct >= 80) return 'Semana incrível! Consistência e hidratação em dia.';
  if (workoutsCount >= 3) return 'Boa semana de treinos! Continue assim.';
  if (workoutsCount >= 1) return 'Cada treino conta. Próxima semana pode ser ainda melhor!';
  if (volumeTotalKg > 0) return 'Você moveu peso esta semana. Que venha a próxima!';
  return 'Nova semana, nova chance de dar o seu melhor.';
}

export async function getWeeklyReportData(): Promise<WeeklyReportData> {
  const { start, end } = getWeekRange();
  const [workoutLogs, waterLogs, weightLogs, goalMl] = await Promise.all([
    getWorkoutLogs(),
    getWaterLogs(),
    getWeightLogs(),
    getWaterGoalMl(),
  ]);

  const workoutsInRange = workoutLogs.filter((log) => {
    const d = log.executedAt.slice(0, 10);
    return d >= start && d <= end;
  });
  const workoutsCount = workoutsInRange.length;
  const volumeTotalKg = workoutsInRange.reduce((s, log) => s + computeVolumeFromLog(log.exercises), 0);

  const waterInRange = waterLogs.filter((w) => w.date >= start && w.date <= end);
  const waterAvgPct =
    waterInRange.length === 0 || goalMl <= 0
      ? 0
      : Math.round((waterInRange.reduce((s, w) => s + w.ml, 0) / waterInRange.length / goalMl) * 100);

  const weightsInRange = weightLogs.filter((w) => w.date >= start && w.date <= end).sort((a, b) => a.date.localeCompare(b.date));
  let weightChangeKg: number | null = null;
  if (weightsInRange.length >= 2) {
    const first = weightsInRange[0].valueKg;
    const last = weightsInRange[weightsInRange.length - 1].valueKg;
    weightChangeKg = Math.round((last - first) * 10) / 10;
  }

  const motivationalPhrase = getMotivationalPhrase(workoutsCount, volumeTotalKg, waterAvgPct);

  return {
    weekStart: start,
    weekEnd: end,
    workoutsCount,
    volumeTotalKg,
    waterAvgPct,
    weightChangeKg,
    motivationalPhrase,
  };
}

export async function scheduleWeeklyReportNotification(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(WEEKLY_REPORT_CHANNEL_ID, {
      name: 'Resumo da semana',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  const trigger: Notifications.WeeklyTriggerInput & { channelId?: string } = {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday: 2,
    hour: 9,
    minute: 0,
  };
  if (Platform.OS === 'android') {
    trigger.channelId = WEEKLY_REPORT_CHANNEL_ID;
  }

  await Notifications.cancelScheduledNotificationAsync(WEEKLY_REPORT_NOTIFICATION_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: WEEKLY_REPORT_NOTIFICATION_ID,
    content: {
      title: 'Resumo da semana',
      body: 'Seu resumo da semana está pronto.',
      sound: 'default',
    },
    trigger,
  });
}

export const WEEKLY_REPORT_NOTIFICATION_ID = 'weekly_report_sunday';
