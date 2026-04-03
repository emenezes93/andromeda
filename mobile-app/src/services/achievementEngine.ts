/**
 * Verifica conquistas e streak; agenda notificação ao atingir marcos de sequência (3, 7, 14, 21, 30 dias).
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { getGlobalStreak } from '../storage/achievements';

const STREAK_CHANNEL_ID = 'streak_milestones';
const KEY_LAST_MILESTONE = '@patient_app_streak_last_milestone';

const MILESTONES = [3, 7, 14, 21, 30];

export async function checkStreakMilestoneNotification(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(STREAK_CHANNEL_ID, {
      name: 'Sequência de dias',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }

  const { count } = await getGlobalStreak();
  let lastNotified = 0;
  try {
    const raw = await AsyncStorage.getItem(KEY_LAST_MILESTONE);
    if (raw) lastNotified = parseInt(raw, 10) || 0;
  } catch {}

  for (const milestone of MILESTONES) {
    if (count >= milestone && lastNotified < milestone) {
      await Notifications.scheduleNotificationAsync({
        identifier: `streak_milestone_${milestone}`,
        content: {
          title: `${milestone} dias de sequência!`,
          body: 'Você manteve o ritmo. Continue assim!',
          sound: 'default',
        },
        trigger: null,
      });
      await AsyncStorage.setItem(KEY_LAST_MILESTONE, String(milestone));
      break;
    }
  }
}
