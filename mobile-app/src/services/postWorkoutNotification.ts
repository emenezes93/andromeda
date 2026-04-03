/**
 * F6.2 — Notificação contextual pós-treino: lembrete de refeição e sugestão de proteína.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const CHANNEL_ID = 'post_workout';

const POST_WORKOUT_NOTIFICATION_ID = 'post_workout_meal_reminder';

export async function schedulePostWorkoutReminder(proteinGoalG?: number | null): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Pós-treino',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  await Notifications.cancelScheduledNotificationAsync(POST_WORKOUT_NOTIFICATION_ID);

  const body =
    proteinGoalG != null && proteinGoalG > 0
      ? `Seu plano sugere ${proteinGoalG}g de proteína na janela pós-treino. Registrar refeição agora?`
      : 'Que tal registrar a refeição pós-treino?';

  await Notifications.scheduleNotificationAsync({
    identifier: POST_WORKOUT_NOTIFICATION_ID,
    content: {
      title: 'Você acabou de treinar!',
      body,
      sound: 'default',
      data: { screen: 'DailyLog' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 15 * 60,
      repeats: false,
    },
  });
}
