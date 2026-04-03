import AsyncStorage from '@react-native-async-storage/async-storage';

export type HealthProvider = 'apple_health' | 'google_fit';

export interface HealthIntegrationState {
  provider: HealthProvider;
  connected: boolean;
  lastSyncAt: string | null;
}

const KEY = '@patient_app_health_integrations';

const DEFAULT_STATE: HealthIntegrationState[] = [
  { provider: 'apple_health', connected: false, lastSyncAt: null },
  { provider: 'google_fit', connected: false, lastSyncAt: null },
];

export async function getHealthIntegrations(): Promise<HealthIntegrationState[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw) as HealthIntegrationState[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_STATE;
  } catch {
    return DEFAULT_STATE;
  }
}

export async function setProviderConnected(provider: HealthProvider, connected: boolean): Promise<void> {
  const current = await getHealthIntegrations();
  const next = current.map((p) =>
    p.provider === provider
      ? { ...p, connected, lastSyncAt: connected ? new Date().toISOString() : null }
      : p
  );
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function markHealthSync(provider: HealthProvider): Promise<void> {
  const current = await getHealthIntegrations();
  const next = current.map((p) => (p.provider === provider ? { ...p, lastSyncAt: new Date().toISOString() } : p));
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}
