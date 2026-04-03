import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  getWaterForDate,
  addWaterForDate,
  getWaterGoalMl,
  setWaterGoalMl,
} from '../storage/waterLogs';
import { getWaterReminderTimes, setWaterReminderTimes } from '../storage/waterReminder';
import { getMealsForDate, getMealLogs, saveMealEntry } from '../storage/mealLogs';
import { getWorkoutLogs } from '../storage/workoutLogs';
import { scheduleWaterReminders, cancelWaterReminders, ensureNotificationSetup } from '../services/waterReminderNotifications';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMyDietPlans, getMyDietPlan } from '../api/diet';
import type { MealLogEntry } from '../types';
import type { DietPlanDetail } from '../types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { spacing, radius, typography, inputHeight, touchTargetMin } from '../theme';
import { EvolutionChart } from '../components/EvolutionChart';
import { AppCard } from '../components/ui/AppCard';
import { Button } from '../components/ui/Button';
import { AppScreen } from '../components/ui/AppScreen';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowTime(): string {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function DailyLogScreen() {
  const { colors } = useTheme();
  const layout = useResponsiveLayout();
  const styles = useMemo(() => createStyles(colors, layout), [colors, layout]);
  const { token, tenantId } = useAuth();
  const date = todayISO();
  const [waterMl, setWaterMl] = useState(0);
  const [waterGoal, setWaterGoal] = useState(2500);
  const [meals, setMeals] = useState<MealLogEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealTime, setMealTime] = useState(nowTime());
  const [mealKcal, setMealKcal] = useState('');
  const [mealProtein, setMealProtein] = useState('');
  const [mealCarbs, setMealCarbs] = useState('');
  const [mealFat, setMealFat] = useState('');
  const [reminderTimes, setReminderTimes] = useState<string[]>([]);
  const [newReminderTime, setNewReminderTime] = useState('08:00');
  const [dietGoals, setDietGoals] = useState<Pick<DietPlanDetail, 'caloriesKcal' | 'proteinG' | 'carbsG' | 'fatG'> | null>(null);
  const [hasWorkoutToday, setHasWorkoutToday] = useState(false);
  const [weekKcal, setWeekKcal] = useState<Record<string, number>>({});

  const load = async () => {
    const [ml, goal, dayMeals, times, allMeals] = await Promise.all([
      getWaterForDate(date),
      getWaterGoalMl(),
      getMealsForDate(date),
      getWaterReminderTimes(),
      getMealLogs(),
    ]);
    setWaterMl(ml);
    setWaterGoal(goal);
    setMeals(dayMeals);
    setReminderTimes(times);

    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    const startStr = weekAgo.toISOString().slice(0, 10);
    const byDate: Record<string, number> = {};
    for (const e of allMeals) {
      if (e.date >= startStr && e.date <= date) {
        byDate[e.date] = (byDate[e.date] ?? 0) + (e.kcal ?? 0);
      }
    }
    setWeekKcal(byDate);

    if (token && tenantId) {
      try {
        const { data: plans } = await getMyDietPlans(token, tenantId, { active: true });
        const active = plans?.find((p) => p.active) ?? plans?.[0];
        if (active) {
          const plan = await getMyDietPlan(active.id, token, tenantId);
          setDietGoals({
            caloriesKcal: plan.caloriesKcal,
            proteinG: plan.proteinG,
            carbsG: plan.carbsG,
            fatG: plan.fatG,
          });
        } else {
          setDietGoals(null);
        }
      } catch {
        setDietGoals(null);
      }
    }

    const logs = await getWorkoutLogs();
    setHasWorkoutToday(logs.some((l) => (l.executedAt || '').slice(0, 10) === date));
  };

  const saveReminders = async (times: string[]) => {
    await setWaterReminderTimes(times);
    if (times.length > 0) {
      await scheduleWaterReminders(times);
    } else {
      await cancelWaterReminders();
    }
  };

  const addReminderTime = async () => {
    const t = newReminderTime.trim();
    if (!/^\d{1,2}:\d{2}$/.test(t)) return;
    const [h, m] = t.split(':').map((n) => parseInt(n, 10));
    if (h < 0 || h > 23 || m < 0 || m > 59) return;
    const normalized = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    if (reminderTimes.includes(normalized)) return;
    const next = [...reminderTimes, normalized].sort();
    setReminderTimes(next);
    await saveReminders(next);
  };

  const removeReminderTime = async (time: string) => {
    const next = reminderTimes.filter((t) => t !== time);
    setReminderTimes(next);
    await saveReminders(next);
  };

  const enableReminders = async () => {
    const ok = await ensureNotificationSetup();
    if (ok && reminderTimes.length > 0) await scheduleWaterReminders(reminderTimes);
  };

  useEffect(() => {
    load();
  }, []);

  const addWater = async (ml: number) => {
    const newTotal = await addWaterForDate(date, ml);
    setWaterMl(newTotal);
  };

  const saveGoal = async () => {
    const n = parseInt(String(waterGoal), 10);
    if (!isNaN(n) && n > 0) {
      await setWaterGoalMl(n);
    }
  };

  const addMeal = async () => {
    const name = mealName.trim();
    if (!name) return;
    const parseNum = (v: string) => {
      const s = v.trim().replace(',', '.');
      if (!s) return null;
      const n = parseFloat(s);
      return isNaN(n) ? null : n;
    };
    const entry: MealLogEntry = {
      id: 'meal-' + Date.now(),
      date,
      time: mealTime,
      name,
      kcal: parseNum(mealKcal) ?? null,
      proteinG: parseNum(mealProtein) ?? null,
      carbsG: parseNum(mealCarbs) ?? null,
      fatG: parseNum(mealFat) ?? null,
    };
    await saveMealEntry(entry);
    setMealName('');
    setMealTime(nowTime());
    setMealKcal('');
    setMealProtein('');
    setMealCarbs('');
    setMealFat('');
    await load();
  };

  const totalKcal = meals.reduce((s, m) => s + (m.kcal ?? 0), 0);
  const totalProtein = meals.reduce((s, m) => s + (m.proteinG ?? 0), 0);
  const totalCarbs = meals.reduce((s, m) => s + (m.carbsG ?? 0), 0);
  const totalFat = meals.reduce((s, m) => s + (m.fatG ?? 0), 0);
  const pct = waterGoal > 0 ? Math.min(100, Math.round((waterMl / waterGoal) * 100)) : 0;

  const macroBar = (consumed: number, goal: number | null, label: string, color: string) => {
    if (goal == null || goal <= 0) return null;
    const pctVal = Math.min(150, Math.round((consumed / goal) * 100));
    return (
      <View key={label} style={styles.macroRow}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValues}>{consumed} / {goal} g</Text>
        <View style={styles.macroBarBg}>
          <View style={[styles.macroBarFill, { width: `${Math.min(100, pctVal)}%`, backgroundColor: color }]} />
        </View>
      </View>
    );
  };

  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().slice(0, 10);
    return { date: dateStr, dayName: dayNames[d.getDay()], shortDate: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) };
  });
  const goalKcal = dietGoals?.caloriesKcal ?? 0;
  const weekAdherence = weekDays.map(({ date }) => {
    const kcal = weekKcal[date] ?? 0;
    let status: 'green' | 'red' | 'gray';
    if (goalKcal <= 0) status = 'gray';
    else if (kcal === 0) status = 'red';
    else if (kcal >= goalKcal * 0.9 && kcal <= goalKcal * 1.1) status = 'green';
    else status = 'red';
    return { date, kcal, status };
  });
  const weekChartData = weekDays.map((d) => ({ date: d.date, value: weekKcal[d.date] ?? 0 }));
  const weekdayKcals = weekAdherence.filter((_, i) => weekDays[i].dayName !== 'Dom' && weekDays[i].dayName !== 'Sáb').map((w) => w.kcal);
  const weekendKcals = weekAdherence.filter((_, i) => weekDays[i].dayName === 'Dom' || weekDays[i].dayName === 'Sáb').map((w) => w.kcal);
  const weekdayAvg = weekdayKcals.length ? weekdayKcals.reduce((a, b) => a + b, 0) / weekdayKcals.length : 0;
  const weekendAvg = weekendKcals.length ? weekendKcals.reduce((a, b) => a + b, 0) / weekendKcals.length : 0;
  const weekendHigher = goalKcal > 0 && weekendAvg > weekdayAvg * 1.1;
  const insightText = weekendHigher
    ? 'Você costuma consumir mais kcal aos fins de semana.'
    : weekChartData.some((p) => p.value > 0)
      ? 'Continue registrando para ver insights de adesão.'
      : null;

  return (
    <AppScreen
      style={styles.container}
      scrollable
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <AppCard style={styles.heroCard}>
        <Text style={styles.kicker}>DIÁRIO</Text>
        <Text style={styles.heroTitle}>Rotina de hoje</Text>
        <Text style={styles.heroSubtitle}>
          Registre água e refeições ao longo do dia para acompanhar adesão e evolução.
        </Text>
        <Button
          title="Adicionar água (+300 ml)"
          onPress={() => addWater(300)}
          accessibilityLabel="Adicionar água"
        />
      </AppCard>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Água hoje</Text>
        <AppCard style={styles.waterCard}>
          <Text style={styles.waterValue}>{waterMl} ml</Text>
          <Text style={styles.waterGoal}>de {waterGoal} ml</Text>
          <View style={styles.waterBarBg}>
            <View style={[styles.waterBarFill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.waterButtons}>
            {[200, 300, 500].map((ml) => (
              <TouchableOpacity
                key={ml}
                style={styles.waterBtn}
                onPress={() => addWater(ml)}
              >
                <Text style={styles.waterBtnText}>+{ml}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.waterGoalLabel}>Meta diária (ml)</Text>
          <TextInput
            style={styles.waterGoalInput}
            value={String(waterGoal)}
            onChangeText={(t) => setWaterGoal(parseInt(t, 10) || 0)}
            onBlur={saveGoal}
            keyboardType="number-pad"
          />
        </AppCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lembrete de água</Text>
        <AppCard style={styles.reminderCard}>
          <Text style={styles.reminderHint}>Notificações nos horários abaixo (diariamente).</Text>
          {reminderTimes.map((t) => (
            <View key={t} style={styles.reminderRow}>
              <Text style={styles.reminderTime}>{t}</Text>
              <TouchableOpacity onPress={() => removeReminderTime(t)} style={styles.reminderRemove}>
                <Text style={styles.reminderRemoveText}>Remover</Text>
              </TouchableOpacity>
            </View>
          ))}
          <View style={styles.reminderAddRow}>
            <TextInput
              style={styles.reminderInput}
              value={newReminderTime}
              onChangeText={setNewReminderTime}
              placeholder="HH:MM"
              placeholderTextColor={colors.textSubtle}
            />
            <TouchableOpacity style={styles.reminderAddBtn} onPress={addReminderTime}>
              <Text style={styles.reminderAddBtnText}>Adicionar</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.reminderEnableBtn} onPress={enableReminders}>
            <Text style={styles.reminderEnableBtnText}>Ativar notificações</Text>
          </TouchableOpacity>
        </AppCard>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Minha semana nutricional</Text>
        <View style={styles.weekCardsWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weekCards}>
            {weekDays.map((d, i) => {
              const w = weekAdherence[i];
              const bg = w.status === 'green' ? colors.success : w.status === 'red' ? colors.error : colors.surfaceElevated;
              return (
                <View key={d.date} style={[styles.weekCard, { backgroundColor: bg + '40', borderColor: bg }]}>
                  <Text style={styles.weekCardDay}>{d.dayName}</Text>
                  <Text style={styles.weekCardDate}>{d.shortDate}</Text>
                  <Text style={styles.weekCardKcal}>{w.kcal > 0 ? `${w.kcal}` : '—'} kcal</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
        {goalKcal > 0 && weekChartData.length > 0 && (
          <>
            <Text style={styles.chartLabel}>Kcal consumida vs meta</Text>
            <EvolutionChart
              data={weekChartData}
              period={30}
              onPeriodChange={() => {}}
              yAxisSuffix=" kcal"
              goalValue={goalKcal}
            />
          </>
        )}
        {insightText != null && (
          <View style={styles.insightWrap}>
            <Ionicons name="bulb" size={18} color={colors.warning} style={styles.insightIcon} />
            <Text style={styles.insightText}>{insightText}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Refeições hoje</Text>
        {hasWorkoutToday && (
          <View style={styles.workoutDayBadge}>
            <Text style={styles.workoutDayBadgeText}>
              Dia de treino — meta de proteína aumentada para {dietGoals?.proteinG ?? '—'}g
            </Text>
          </View>
        )}
        <AppCard style={styles.mealForm}>
          <TextInput
            style={styles.input}
            placeholder="Nome da refeição"
            placeholderTextColor={colors.textSubtle}
            value={mealName}
            onChangeText={setMealName}
          />
          <View style={styles.mealFormRow}>
            <TextInput
              style={[styles.input, styles.inputSmall]}
              placeholder="Horário"
              placeholderTextColor={colors.textSubtle}
              value={mealTime}
              onChangeText={setMealTime}
            />
            <TextInput
              style={[styles.input, styles.inputSmall]}
              placeholder="kcal"
              placeholderTextColor={colors.textSubtle}
              value={mealKcal}
              onChangeText={setMealKcal}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.mealFormRow}>
            <TextInput
              style={[styles.input, styles.inputThird]}
              placeholder="P (g)"
              placeholderTextColor={colors.textSubtle}
              value={mealProtein}
              onChangeText={setMealProtein}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, styles.inputThird]}
              placeholder="C (g)"
              placeholderTextColor={colors.textSubtle}
              value={mealCarbs}
              onChangeText={setMealCarbs}
              keyboardType="decimal-pad"
            />
            <TextInput
              style={[styles.input, styles.inputThird]}
              placeholder="G (g)"
              placeholderTextColor={colors.textSubtle}
              value={mealFat}
              onChangeText={setMealFat}
              keyboardType="decimal-pad"
            />
          </View>
          <TouchableOpacity style={styles.addMealBtn} onPress={addMeal}>
            <Text style={styles.addMealBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </AppCard>
        {meals.length > 0 && (
          <>
            <AppCard style={styles.totalsCard}>
              <Text style={styles.totalKcal}>Total: {totalKcal} kcal</Text>
              {(dietGoals?.caloriesKcal != null && dietGoals.caloriesKcal > 0) && (
                <View style={styles.kcalBarRow}>
                  <View style={styles.macroBarBg}>
                    <View
                      style={[
                        styles.macroBarFill,
                        {
                          width: `${Math.min(100, Math.round((totalKcal / dietGoals.caloriesKcal) * 100))}%`,
                          backgroundColor: colors.primary,
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.macroValues}>{totalKcal} / {dietGoals.caloriesKcal} kcal</Text>
                </View>
              )}
              {dietGoals && (
                <>
                  {macroBar(totalProtein, dietGoals.proteinG ?? null, 'Proteína', colors.success)}
                  {macroBar(totalCarbs, dietGoals.carbsG ?? null, 'Carboidratos', colors.warning)}
                  {macroBar(totalFat, dietGoals.fatG ?? null, 'Gorduras', colors.primary)}
                </>
              )}
            </AppCard>
            {meals.map((m) => (
              <View key={m.id} style={styles.mealRow}>
                <Text style={styles.mealTime}>{m.time}</Text>
                <View style={styles.mealInfo}>
                  <Text style={styles.mealName}>{m.name}</Text>
                  <View style={styles.mealMacros}>
                    {m.kcal != null && <Text style={styles.mealKcal}>{m.kcal} kcal</Text>}
                    {(m.proteinG != null || m.carbsG != null || m.fatG != null) && (
                      <Text style={styles.mealMacroDetail}>
                        {[m.proteinG != null && `P ${m.proteinG}g`, m.carbsG != null && `C ${m.carbsG}g`, m.fatG != null && `G ${m.fatG}g`].filter(Boolean).join(' · ')}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </>
        )}
      </View>
    </AppScreen>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  layout: ReturnType<typeof useResponsiveLayout>
) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: layout.contentPadding, paddingBottom: spacing.listBottom },
  heroCard: { marginBottom: spacing.xl },
  kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.textSubtle, marginBottom: spacing.xs },
  heroTitle: { ...typography.titleSmall, fontSize: layout.titleSize + 2, color: colors.text, marginBottom: spacing.xs },
  heroSubtitle: { fontSize: layout.bodySize, color: colors.textMuted, lineHeight: layout.bodySize + 6, marginBottom: spacing.lg },
  section: { marginBottom: spacing.xl },
  sectionTitle: { ...typography.sectionTitle, color: colors.textSecondary, marginBottom: spacing.md },
  workoutDayBadge: {
    backgroundColor: colors.primary + '20',
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  workoutDayBadgeText: {
    ...typography.body,
    color: colors.text,
  },
  waterCard: {
    padding: spacing.lg,
  },
  waterValue: { fontSize: 28, fontWeight: '700', color: colors.primary },
  waterGoal: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  waterBarBg: {
    height: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 4,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  waterBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  waterButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  waterBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterBtnText: { color: '#fff', fontWeight: '600' },
  waterGoalLabel: { fontSize: 13, color: colors.textMuted, marginTop: spacing.lg },
  waterGoalInput: {
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    height: inputHeight,
    fontSize: 16,
    color: colors.text,
    marginTop: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderCard: {
    padding: spacing.lg,
  },
  reminderHint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  reminderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  reminderTime: { fontSize: 16, fontWeight: '600', color: colors.text },
  reminderRemove: { paddingVertical: 4, paddingHorizontal: 8 },
  reminderRemoveText: { fontSize: 14, color: colors.error },
  reminderAddRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, alignItems: 'center' },
  reminderInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reminderAddBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minHeight: touchTargetMin,
    justifyContent: 'center',
  },
  reminderAddBtnText: { color: '#fff', fontWeight: '600' },
  reminderEnableBtn: {
    marginTop: spacing.lg,
    paddingVertical: spacing.sm,
    minHeight: touchTargetMin,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reminderEnableBtnText: { fontSize: 14, color: colors.primary, fontWeight: '600' },
  weekCardsWrap: { marginBottom: spacing.md },
  weekCards: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  weekCard: {
    width: 72,
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 2,
    alignItems: 'center',
  },
  weekCardDay: { fontSize: 12, fontWeight: '600', color: colors.text },
  weekCardDate: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  weekCardKcal: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  chartLabel: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
  insightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  insightIcon: {},
  insightText: { flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  mealForm: { marginBottom: spacing.lg, padding: spacing.lg },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    height: inputHeight,
    fontSize: 16,
    color: colors.text,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  mealFormRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.sm },
  inputSmall: { flex: 1 },
  inputThird: { flex: 1 },
  totalsCard: {
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  kcalBarRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  macroRow: { marginTop: spacing.sm },
  macroLabel: { fontSize: 13, color: colors.textMuted },
  macroValues: { fontSize: 13, color: colors.text, fontWeight: '600' },
  macroBarBg: {
    height: 6,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 3,
    marginTop: 2,
    overflow: 'hidden',
    flex: 1,
  },
  macroBarFill: { height: '100%', borderRadius: 3 },
  mealRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.md },
  mealInfo: { flex: 1 },
  mealMacros: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  mealMacroDetail: { fontSize: 12, color: colors.textMuted },
  addMealBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: touchTargetMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addMealBtnText: { color: '#fff', fontWeight: '600' },
  totalKcal: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
  mealTime: { width: 48, fontSize: 14, color: colors.textMuted },
  mealName: { flex: 1, fontSize: 15, color: colors.text },
  mealKcal: { fontSize: 14, color: colors.textMuted },
  });
}
