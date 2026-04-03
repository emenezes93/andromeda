import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

const WATER_CHANNEL_ID = 'water_reminders';

export async function ensureNotificationSetup(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(WATER_CHANNEL_ID, {
      name: 'Lembrete de água',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
    });
  }
  return true;
}

function parseTime(t: string): { hour: number; minute: number } {
  const [h, m] = t.split(':').map((s) => parseInt(s, 10));
  return { hour: isNaN(h) ? 8 : h, minute: isNaN(m) ? 0 : m };
}

function idForTime(t: string): string {
  return `water_reminder_${t.replace(':', '_')}`;
}

export async function scheduleWaterReminders(times: string[]): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();

  const hasPermission = await ensureNotificationSetup();
  if (!hasPermission || times.length === 0) return;

  for (const timeStr of times) {
    const { hour, minute } = parseTime(timeStr);
    const trigger: Notifications.DailyTriggerInput = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };
    if (Platform.OS === 'android') {
      trigger.channelId = WATER_CHANNEL_ID;
    }
    await Notifications.scheduleNotificationAsync({
      identifier: idForTime(timeStr),
      content: {
        title: 'Hidratação',
        body: 'Que tal beber um copo de água?',
        sound: 'default',
      },
      trigger,
    });
  }
}

export async function cancelWaterReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
