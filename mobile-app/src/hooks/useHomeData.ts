import { useCallback, useEffect, useState } from 'react';
import { getMe } from '../api/auth';
import { getWaterForDate, getWaterGoalMl } from '../storage/waterLogs';
import { getMealsForDate } from '../storage/mealLogs';
import { getWeightLogs } from '../storage/weightLogs';
import { getGlobalStreak } from '../storage/achievements';
import { checkStreakMilestoneNotification } from '../services/achievementEngine';
import { getPendingSyncCount } from '../storage/syncQueue';
import { runSync } from '../services/syncService';
import { getExpoPushTokenAsync, registerPushTokenWithBackend } from '../services/pushService';
import { getMyNotifications } from '../api/notifications';
import { getMyTrainingPlans } from '../api/training';
import type { MeResponse } from '../types';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface UseHomeDataResult {
  me: MeResponse | null;
  loading: boolean;
  refreshing: boolean;
  load: (refresh?: boolean) => Promise<void>;
  waterMl: number;
  waterGoal: number;
  todayKcal: number;
  lastWeight: { kg: number; date: string } | null;
  globalStreak: number;
  syncPendingCount: number;
  hasTrainingPlans: boolean;
}

export function useHomeData(
  token: string | null,
  tenantId: string | null,
  setUnreadCount: (n: number) => void
): UseHomeDataResult {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [waterMl, setWaterMl] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2500);
  const [todayKcal, setTodayKcal] = useState(0);
  const [lastWeight, setLastWeight] = useState<{ kg: number; date: string } | null>(null);
  const [globalStreak, setGlobalStreak] = useState(0);
  const [syncPendingCount, setSyncPendingCount] = useState(0);
  const [hasTrainingPlans, setHasTrainingPlans] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      if (!token || !tenantId) {
        setLoading(false);
        return;
      }
      if (refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const [data, ml, goal, meals, weightLogs] = await Promise.all([
          getMe(token, tenantId),
          getWaterForDate(todayISO()),
          getWaterGoalMl(),
          getMealsForDate(todayISO()),
          getWeightLogs(),
        ]);
        setMe(data);
        setWaterMl(ml);
        setWaterGoal(goal);
        setTodayKcal(meals.reduce((s, m) => s + (m.kcal ?? 0), 0));
        const latest = weightLogs[0];
        setLastWeight(latest ? { kg: latest.valueKg, date: latest.date } : null);
        const streak = await getGlobalStreak();
        setGlobalStreak(streak.count);
        checkStreakMilestoneNotification().catch(() => {});
        const pending = await getPendingSyncCount();
        setSyncPendingCount(pending);
        if (pending > 0) {
          runSync(token, tenantId).then(async () => {
            const p = await getPendingSyncCount();
            setSyncPendingCount(p);
          }).catch(() => {});
        }
        getExpoPushTokenAsync().then((expoToken) => {
          if (expoToken) registerPushTokenWithBackend(expoToken, token, tenantId).catch(() => {});
        }).catch(() => {});
        getMyNotifications(token, tenantId, { limit: 50 })
          .then((res) => setUnreadCount(res.data.filter((n) => !n.read).length))
          .catch(() => {});
        getMyTrainingPlans(token, tenantId, { limit: 1, active: true })
          .then((res) => setHasTrainingPlans(res.data.length > 0))
          .catch(() => setHasTrainingPlans(false));
      } catch {
        setMe(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, tenantId, setUnreadCount]
  );

  useEffect(() => {
    load();
  }, [load]);

  return {
    me,
    loading,
    refreshing,
    load,
    waterMl,
    waterGoal,
    todayKcal,
    lastWeight,
    globalStreak,
    syncPendingCount,
    hasTrainingPlans,
  };
}
