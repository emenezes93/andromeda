import type { HealthMetricsEntry } from '../types';

type Provider = 'apple_health' | 'google_fit';

type PedometerModule = {
  Pedometer?: {
    isAvailableAsync: () => Promise<boolean>;
    getStepCountAsync: (start: Date, end: Date) => Promise<{ steps: number }>;
  };
};

function todayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

async function readStepsFromPedometerLast24h(): Promise<number | null> {
  try {
    const moduleRef = require('expo-sensors') as PedometerModule;
    if (!moduleRef.Pedometer) return null;
    const available = await moduleRef.Pedometer.isAvailableAsync();
    if (!available) return null;
    const end = new Date();
    const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    const result = await moduleRef.Pedometer.getStepCountAsync(start, end);
    const steps = typeof result?.steps === 'number' ? result.steps : 0;
    return Math.max(0, Math.round(steps));
  } catch {
    return null;
  }
}

function estimateActiveMinutes(steps: number): number {
  return Math.max(0, Math.round(steps / 120));
}

export interface HealthProviderCapabilities {
  pedometerAvailable: boolean;
  bridgeAvailable: boolean;
}

export async function getHealthCapabilities(): Promise<HealthProviderCapabilities> {
  const steps = await readStepsFromPedometerLast24h();
  return {
    pedometerAvailable: steps !== null,
    bridgeAvailable: false,
  };
}

export async function collectHealthMetrics(provider: Provider): Promise<HealthMetricsEntry> {
  const steps = await readStepsFromPedometerLast24h();
  if (steps !== null) {
    return {
      id: `health-${provider}-${Date.now()}`,
      provider,
      date: todayDate(),
      steps,
      activeMinutes: estimateActiveMinutes(steps),
      sleepMinutes: null,
      source: 'pedometer',
    };
  }

  return {
    id: `health-${provider}-${Date.now()}`,
    provider,
    date: todayDate(),
    steps: null,
    activeMinutes: null,
    sleepMinutes: null,
    source: 'manual_fallback',
  };
}
