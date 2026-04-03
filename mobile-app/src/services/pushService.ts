/**
 * Serviço de notificações push remotas (F5.2). Registra token com o backend e trata deep link ao tocar na notificação.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { apiFetch } from '../api/client';
import { isDevToken } from '../api/andromeda';

export type NavigationRef = { current: { navigate: (name: string, params?: object) => void } | null };

let navigationRef: NavigationRef | null = null;

export function setPushNavigationRef(ref: NavigationRef | null): void {
  navigationRef = ref;
}

/** Solicita permissão e retorna o token Expo Push (para enviar ao backend). */
export async function getExpoPushTokenAsync(): Promise<string | null> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData?.data ?? null;
  } catch {
    return null;
  }
}

/** Envia o token de push ao backend Andromeda (quando o endpoint existir). */
export async function registerPushTokenWithBackend(
  expoPushToken: string,
  token: string,
  tenantId: string
): Promise<void> {
  if (isDevToken(token)) return;
  try {
    await apiFetch('/v1/patient-portal/me/push-token', {
      method: 'POST',
      token,
      tenantId,
      body: JSON.stringify({
        token: expoPushToken,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      }),
    });
  } catch {
    // Backend pode não ter o endpoint ainda
  }
}

/** Configura o handler para quando o usuário toca numa notificação (deep link). */
export function setupNotificationResponseHandler(): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, string> | undefined;
    if (!data || !navigationRef?.current) return;
    const screen = data.screen as string | undefined;
    const params = data.params ? (typeof data.params === 'string' ? JSON.parse(data.params) : data.params) : undefined;
    try {
      if (screen === 'TrainingList') {
        (navigationRef.current.navigate as (a: string, b?: object) => void)('Main', { screen: 'Treinos', params: { screen: 'TrainingList' } });
      } else if (screen === 'DietList') {
        (navigationRef.current.navigate as (a: string, b?: object) => void)('Main', { screen: 'Dieta', params: { screen: 'DietList' } });
      } else if (screen === 'DailyLog') {
        (navigationRef.current.navigate as (a: string, b?: object) => void)('Main', { screen: 'Dieta', params: { screen: 'DailyLog' } });
      } else if (screen === 'ProgressPhotos') {
        (navigationRef.current.navigate as (a: string, b?: object) => void)('Main', { screen: 'Progresso', params: { screen: 'ProgressPhotos' } });
      } else if (screen && params) {
        navigationRef.current.navigate(screen, params);
      } else if (screen) {
        navigationRef.current.navigate(screen);
      }
    } catch {
      // Navegação pode falhar se stack não estiver montado
    }
  });
  return () => sub.remove();
}
