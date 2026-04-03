/**
 * Lembretes de refeição no horário sugerido pelo plano de dieta (mealPlanJson).
 */
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const MEAL_CHANNEL_ID = 'meal_reminders';
const KEY_IDS = '@patient_app_meal_reminder_ids';
const KEY_PLAN_ID = '@patient_app_meal_reminder_plan_id';

export async function ensureNotificationSetup(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(MEAL_CHANNEL_ID, {
      name: 'Lembrete de refeição',
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

function idForMeal(planId: string, index: number): string {
  return `meal_reminder_${planId.replace(/[^a-z0-9-]/gi, '_')}_${index}`;
}

export interface MealReminderItem {
  name: string;
  time: string;
}

export async function scheduleMealReminders(
  planId: string,
  meals: MealReminderItem[],
  dailyKcal?: number | null,
  dailyProtein?: number | null
): Promise<void> {
  const hasPermission = await ensureNotificationSetup();
  if (!hasPermission) return;

  const storedIds = await getStoredMealReminderIds();
  for (const id of storedIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {}
  }

  if (meals.length === 0) {
    await AsyncStorage.multiRemove([KEY_IDS, KEY_PLAN_ID]);
    return;
  }

  const meta = [];
  if (dailyKcal != null && dailyKcal > 0) meta.push(`${dailyKcal} kcal`);
  if (dailyProtein != null && dailyProtein > 0) meta.push(`${dailyProtein}g proteína`);
  const metaStr = meta.length > 0 ? ` — Meta diária: ${meta.join(', ')}` : '';

  const identifiers: string[] = [];
  for (let i = 0; i < meals.length; i++) {
    const meal = meals[i];
    const { hour, minute } = parseTime(meal.time);
    const trigger: Notifications.DailyTriggerInput & { channelId?: string } = {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    };
    if (Platform.OS === 'android') {
      trigger.channelId = MEAL_CHANNEL_ID;
    }
    const identifier = idForMeal(planId, i);
    await Notifications.scheduleNotificationAsync({
      identifier,
      content: {
        title: `Hora do ${meal.name}`,
        body: `Sua refeição do plano.${metaStr}`,
        sound: 'default',
      },
      trigger,
    });
    identifiers.push(identifier);
  }

  await AsyncStorage.setItem(KEY_IDS, JSON.stringify(identifiers));
  await AsyncStorage.setItem(KEY_PLAN_ID, planId);
}

async function getStoredMealReminderIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY_IDS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function cancelMealReminders(): Promise<void> {
  const storedIds = await getStoredMealReminderIds();
  for (const id of storedIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {}
  }
  await AsyncStorage.multiRemove([KEY_IDS, KEY_PLAN_ID]);
}

export async function getMealReminderPlanId(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY_PLAN_ID);
  } catch {
    return null;
  }
}
