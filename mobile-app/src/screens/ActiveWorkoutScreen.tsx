import React, { useEffect, useMemo, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Alert,
  Vibration,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMyTrainingPlan, logWorkout } from '../api/training';
import { getMyDietPlans, getMyDietPlan } from '../api/diet';
import { schedulePostWorkoutReminder } from '../services/postWorkoutNotification';
import { saveWorkoutLog, getLastWorkoutLogForPlan, getLastSessionLoadByExercise, getLastTwoWorkoutLogsForPlan, getProgressionSuggestions, parseMinReps } from '../storage/workoutLogs';
import { getPersonalRecords, getPersonalRecordForExercise } from '../services/personalRecords';
import type { TrainingPlanDetail } from '../types';
import type { WorkoutSetRecord, WorkoutExerciseLog, SavedWorkoutLog } from '../types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { spacing, radius, typography } from '../theme';
import { AppCard } from '../components/ui/AppCard';
import { Button } from '../components/ui/Button';

interface PlanJsonExercise {
  name?: string;
  sets?: string;
  reps?: string;
  rest?: string;
  muscleGroup?: string;
}

interface PlanJsonDay {
  dayLabel?: string;
  exercises?: PlanJsonExercise[];
}

function parseSetsCount(setsStr?: string): number {
  if (!setsStr) return 3;
  const n = parseInt(setsStr, 10);
  return isNaN(n) || n < 1 ? 3 : Math.min(n, 10);
}

function parseRestSeconds(restStr?: string): number {
  if (!restStr) return 60;
  const n = parseInt(restStr.replace(/\D/g, ''), 10);
  return isNaN(n) || n < 1 ? 60 : Math.min(n, 300);
}

export function ActiveWorkoutScreen({
  route,
  navigation,
}: {
  route: { params: { planId: string; planName?: string } };
  navigation: { goBack: () => void };
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token, tenantId } = useAuth();
  const [plan, setPlan] = useState<TrainingPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [dayIndex, setDayIndex] = useState(0);
  const [setRecords, setSetRecords] = useState<Record<string, WorkoutSetRecord>>({});
  const [saving, setSaving] = useState(false);
  const [personalRecords, setPersonalRecords] = useState<Awaited<ReturnType<typeof getPersonalRecords>>>([]);
  const [restState, setRestState] = useState<{ exIdx: number; setIdx: number; secondsLeft: number } | null>(null);
  const [lastSessionLoads, setLastSessionLoads] = useState<Map<string, { weightKg: number; reps: number }>>(new Map());
  const [showPostWorkoutSummary, setShowPostWorkoutSummary] = useState(false);
  const [showPostWorkoutFeedback, setShowPostWorkoutFeedback] = useState(false);
  const [postWorkoutData, setPostWorkoutData] = useState<{
    volumeTotal: number;
    volumePrevious: number;
    e1rmByExercise: { name: string; e1rm: number }[];
  } | null>(null);
  const pendingLogRef = useRef<SavedWorkoutLog | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const [elapsedMinutes, setElapsedMinutes] = useState(0);
  const [progressionSuggestions, setProgressionSuggestions] = useState<Map<string, { type: 'increase' | 'decrease'; suggestedWeightKg: number; message: string }>>(new Map());

  useEffect(() => {
    const update = () => setElapsedMinutes(Math.floor((Date.now() - startTimeRef.current) / 60000));
    update();
    const interval = setInterval(update, 10000);
    return () => clearInterval(interval);
  }, []);

  const planId = route.params.planId;
  const norm = (s: string) => s.trim().toLowerCase();
  const planName = route.params.planName ?? 'Treino';

  useEffect(() => {
    let cancelled = false;
    if (!token || !tenantId) return;
    getMyTrainingPlan(planId, token, tenantId)
      .then((p) => { if (!cancelled) setPlan(p); })
      .catch(() => { if (!cancelled) setPlan(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [token, tenantId, planId]);

  useEffect(() => {
    getPersonalRecords().then(setPersonalRecords);
  }, []);

  useEffect(() => {
    if (!planId) return;
    getLastWorkoutLogForPlan(planId).then((log) => {
      setLastSessionLoads(getLastSessionLoadByExercise(log));
    });
  }, [planId]);

  useEffect(() => {
    if (!planId || !plan?.planJson) return;
    const planJson = plan.planJson as { days?: PlanJsonDay[] };
    const days = planJson?.days ?? [];
    const dayExercises = days[dayIndex]?.exercises ?? [];
    if (dayExercises.length === 0) return;
    getLastTwoWorkoutLogsForPlan(planId).then((lastTwo) => {
      const names = dayExercises.map((e) => e.name ?? '');
      const suggestedMinReps = (normalizedName: string) => {
        const ex = dayExercises.find((e) => norm(e.name ?? '') === normalizedName);
        return ex ? parseMinReps(ex.reps) : 0;
      };
      setProgressionSuggestions(getProgressionSuggestions(lastTwo, names, suggestedMinReps));
    });
  }, [planId, plan, dayIndex]);

  useEffect(() => {
    if (restState === null) return;
    const id = setInterval(() => {
      setRestState((prev) => {
        if (!prev || prev.secondsLeft <= 1) {
          Vibration.vibrate(400);
          return null;
        }
        return { ...prev, secondsLeft: prev.secondsLeft - 1 };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [restState?.exIdx, restState?.setIdx]);

  const planJson = plan?.planJson as { days?: PlanJsonDay[] } | undefined;
  const days = planJson?.days ?? [];
  const day = days[dayIndex];
  const exercises = day?.exercises ?? [];

  const getSetKey = (exIdx: number, setIdx: number) => `${exIdx}-${setIdx}`;

  const updateSet = (exIdx: number, setIdx: number, patch: Partial<WorkoutSetRecord>) => {
    const key = getSetKey(exIdx, setIdx);
    setSetRecords((prev) => ({
      ...prev,
      [key]: { ...prev[key], completed: prev[key]?.completed ?? false, ...patch },
    }));
  };

  const toggleSetCompleted = (exIdx: number, setIdx: number) => {
    const key = getSetKey(exIdx, setIdx);
    const current = setRecords[key];
    const nextCompleted = !current?.completed;
    setSetRecords((prev) => ({
      ...prev,
      [key]: { ...prev[key], completed: nextCompleted },
    }));
    if (nextCompleted) {
      const ex = exercises[exIdx];
      const seconds = ex ? parseRestSeconds(ex.rest) : 60;
      setRestState({ exIdx, setIdx, secondsLeft: seconds });
    }
  };

  const startRest = (exIdx: number, setIdx: number) => {
    const ex = exercises[exIdx];
    const seconds = ex ? parseRestSeconds(ex.rest) : 60;
    setRestState({ exIdx, setIdx, secondsLeft: seconds });
  };

  const addRest30 = () => {
    setRestState((prev) => (prev ? { ...prev, secondsLeft: Math.min(300, prev.secondsLeft + 30) } : null));
  };

  const skipRest = () => setRestState(null);

  function normName(s: string) {
    return s.trim().toLowerCase();
  }

  function getLastLoadForExercise(exerciseName: string): { weightKg: number; reps: number } | null {
    return lastSessionLoads.get(normName(exerciseName ?? '')) ?? null;
  }

  function didExceedLastSession(exIdx: number): boolean {
    const ex = exercises[exIdx];
    const last = getLastLoadForExercise(ex?.name ?? '');
    if (!last) return false;
    const numSets = parseSetsCount(ex?.sets);
    for (let s = 0; s < numSets; s++) {
      const key = getSetKey(exIdx, s);
      const rec = setRecords[key];
      const w = rec?.weightKg ?? 0;
      const r = rec?.reps ?? 0;
      if (w >= last.weightKg && r >= last.reps && (w > last.weightKg || r > last.reps)) return true;
    }
    return false;
  }

  const computeVolume = (logs: WorkoutExerciseLog[]): number => {
    let v = 0;
    for (const ex of logs) {
      for (const set of ex.sets as WorkoutSetRecord[]) {
        const w = set.weightKg ?? 0;
        const r = set.reps ?? 0;
        v += w * r;
      }
    }
    return v;
  };

  const computeE1rm = (logs: WorkoutExerciseLog[]): { name: string; e1rm: number }[] => {
    const result: { name: string; e1rm: number }[] = [];
    for (const ex of logs) {
      let maxE1rm = 0;
      for (const set of ex.sets as WorkoutSetRecord[]) {
        const w = set.weightKg ?? 0;
        const r = set.reps ?? 0;
        if (w > 0 && r > 0) {
          const e1rm = w * (1 + r / 30);
          if (e1rm > maxE1rm) maxE1rm = e1rm;
        }
      }
      if (maxE1rm > 0) result.push({ name: ex.exerciseName, e1rm: Math.round(maxE1rm * 10) / 10 });
    }
    return result;
  };

  const handleFinish = async () => {
    if (!plan || !day) return;
    const executedAt = new Date().toISOString();
    const durationMinutes = Math.round((Date.now() - startTimeRef.current) / 60000);

    const exerciseLogs: WorkoutExerciseLog[] = exercises.map((ex, exIdx) => {
      const numSets = parseSetsCount(ex.sets);
      const sets: WorkoutSetRecord[] = [];
      for (let s = 0; s < numSets; s++) {
        const key = getSetKey(exIdx, s);
        sets.push(setRecords[key] ?? { completed: false });
      }
      return {
        exerciseName: ex.name ?? 'Exercício',
        suggestedSets: ex.sets,
        suggestedReps: ex.reps,
        sets,
      };
    });

    const logEntry: SavedWorkoutLog = {
      id: 'log-' + Date.now(),
      planId,
      planName,
      dayLabel: day.dayLabel ?? `Dia ${dayIndex + 1}`,
      executedAt,
      durationMinutes,
      exercises: exerciseLogs,
    };

    setSaving(true);
    try {
      const volumeTotal = computeVolume(exerciseLogs);
      const lastLog = await getLastWorkoutLogForPlan(planId);
      const volumePrevious = lastLog ? computeVolume(lastLog.exercises) : 0;
      const e1rmByExercise = computeE1rm(exerciseLogs);
      await saveWorkoutLog(logEntry);
      pendingLogRef.current = logEntry;
      setPostWorkoutData({
        volumeTotal,
        volumePrevious,
        e1rmByExercise,
      });
      setShowPostWorkoutSummary(true);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  };

  const handleClosePostWorkoutSummary = async () => {
    setShowPostWorkoutSummary(false);
    const log = pendingLogRef.current;
    if (token && tenantId && log) {
      try {
        await logWorkout(
          {
            trainingPlanId: planId,
            executedAt: log.executedAt,
            durationMinutes: log.durationMinutes ?? undefined,
            completed: true,
          },
          token,
          tenantId
        );
      } catch (_) {}
      // F6.2 — Notificação pós-treino (15 min) com sugestão de proteína do plano
      (async () => {
        try {
          const { data: plans } = await getMyDietPlans(token, tenantId, { active: true });
          const active = plans?.find((p) => p.active) ?? plans?.[0];
          const proteinG = active ? (await getMyDietPlan(active.id, token, tenantId)).proteinG : null;
          await schedulePostWorkoutReminder(proteinG ?? undefined);
        } catch {
          await schedulePostWorkoutReminder();
        }
      })();
      setShowPostWorkoutFeedback(true);
      return;
    }
    pendingLogRef.current = null;
    navigation.goBack();
  };

  const saveWorkoutFeedback = async (rating: 'easy' | 'ok' | 'hard') => {
    const log = pendingLogRef.current;
    try {
      const payload = {
        executedAt: log?.executedAt,
        planId,
        rating,
        at: new Date().toISOString(),
      };
      await AsyncStorage.setItem('@patient_app_last_workout_feedback', JSON.stringify(payload));
    } catch {}
    pendingLogRef.current = null;
    setShowPostWorkoutFeedback(false);
    navigation.goBack();
  };

  const skipWorkoutFeedback = () => {
    pendingLogRef.current = null;
    setShowPostWorkoutFeedback(false);
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!plan || days.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Plano não encontrado ou sem dias.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const totalExercises = exercises.length;
  const completedExercises = exercises.filter((ex, exIdx) => {
    const numSets = parseSetsCount(ex.sets);
    return Array.from({ length: numSets }, (_, setIdx) => getSetKey(exIdx, setIdx))
      .every((key) => (setRecords[key]?.completed) === true);
  }).length;
  const currentExerciseIndex = Math.min(completedExercises + 1, totalExercises);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppCard style={styles.workoutHeader}>
        <Text style={styles.title}>{planName}</Text>
        <View style={styles.workoutMeta}>
          <View style={styles.durationRow}>
            <Ionicons name="time-outline" size={14} color={colors.textMuted} />
            <Text style={styles.durationText}>{elapsedMinutes} min</Text>
          </View>
          {totalExercises > 0 && (
            <Text style={styles.progressText}>
              Exercício {currentExerciseIndex} de {totalExercises}
            </Text>
          )}
        </View>
        <Button
          title="Finalizar treino"
          onPress={handleFinish}
          disabled={saving}
          loading={saving}
          style={styles.headerFinishBtn}
          accessibilityLabel="Finalizar treino"
        />
      </AppCard>
      {days.length > 1 && (
        <View style={styles.dayTabs}>
          {days.map((d, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.dayTab, dayIndex === idx && styles.dayTabActive]}
              onPress={() => setDayIndex(idx)}
            >
              <Text style={[styles.dayTabText, dayIndex === idx && styles.dayTabTextActive]}>
                {d.dayLabel ?? `Dia ${idx + 1}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {restState !== null && (
        <View style={styles.restBar}>
          <Text style={styles.restText}>
            Descanso: {Math.floor(restState.secondsLeft / 60)}:{(restState.secondsLeft % 60).toString().padStart(2, '0')}
          </Text>
          <View style={styles.restActions}>
            <TouchableOpacity onPress={addRest30} style={styles.restAdd30}>
              <Text style={styles.restSkipText}>+30s</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={skipRest} style={styles.restSkip}>
              <Text style={styles.restSkipText}>Pular</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <Text style={styles.sectionTitle}>Marque as séries e anote carga/reps</Text>
      <Text style={styles.sectionHint}>
        Toque em Descanso para iniciar o cronômetro. Marque as séries concluídas e registre peso e reps.
      </Text>

      {exercises.map((ex, exIdx) => {
        const numSets = parseSetsCount(ex.sets);
        const pr = getPersonalRecordForExercise(personalRecords, ex.name ?? '');
        const lastLoad = getLastLoadForExercise(ex.name ?? '');
        const showNewPR = didExceedLastSession(exIdx);
        const suggestion = ex.name ? progressionSuggestions.get(norm(ex.name)) : null;
        return (
          <AppCard key={exIdx} style={styles.exCard}>
            <Text style={styles.exName}>{ex.name ?? 'Exercício'}</Text>
            {lastLoad ? (
              <Text style={styles.lastLoadText}>Última: {lastLoad.weightKg} kg × {lastLoad.reps} reps</Text>
            ) : (
              <Text style={styles.firstTimeText}>Primeira vez — defina sua carga base</Text>
            )}
            {showNewPR && (
              <View style={styles.newPRBadgeRow}>
                <Ionicons name="flame" size={16} color={colors.warning} />
                <Text style={styles.newPRBadge}>Novo PR!</Text>
              </View>
            )}
            {pr?.displayText && pr.displayText !== '—' ? (
              <Text style={styles.prText}>Melhor histórico: {pr.displayText}</Text>
            ) : null}
            {suggestion && (
              <View style={[styles.suggestionBanner, suggestion.type === 'increase' ? styles.suggestionIncrease : styles.suggestionDecrease]}>
                <Text style={styles.suggestionText}>{suggestion.message}</Text>
                <Text style={styles.suggestionDisclaimer}>Confirme com seu personal antes de alterar.</Text>
              </View>
            )}
            <Text style={styles.exSuggested}>
              Sugestão: {ex.sets ?? '?'} séries · {ex.reps ?? '?'} reps
              {ex.rest ? ` · ${ex.rest} descanso` : ''}
            </Text>
            {Array.from({ length: numSets }, (_, setIdx) => {
              const key = getSetKey(exIdx, setIdx);
              const rec = setRecords[key] ?? { completed: false };
              return (
                <View key={setIdx} style={styles.setRow}>
                  <TouchableOpacity
                    style={[styles.checkbox, rec.completed && styles.checkboxChecked]}
                    onPress={() => toggleSetCompleted(exIdx, setIdx)}
                  >
                    {rec.completed ? <Ionicons name="checkmark-circle" size={22} color={colors.success} style={styles.checkIcon} /> : null}
                  </TouchableOpacity>
                  <Text style={styles.setLabel}>Série {setIdx + 1}</Text>
                  <TextInput
                    style={styles.setInput}
                    placeholder="Peso (kg)"
                    placeholderTextColor={colors.textSubtle}
                    keyboardType="decimal-pad"
                    value={rec.weightKg != null ? String(rec.weightKg) : ''}
                    onChangeText={(t) => {
                      const v = t.trim() ? parseFloat(t.replace(',', '.')) : undefined;
                      updateSet(exIdx, setIdx, { weightKg: v });
                    }}
                  />
                  <TextInput
                    style={styles.setInput}
                    placeholder="Reps"
                    placeholderTextColor={colors.textSubtle}
                    keyboardType="number-pad"
                    value={rec.reps != null ? String(rec.reps) : ''}
                    onChangeText={(t) => {
                      const v = t.trim() ? parseInt(t, 10) : undefined;
                      updateSet(exIdx, setIdx, { reps: isNaN(v!) ? undefined : v });
                    }}
                  />
                  <TouchableOpacity
                    style={styles.restBtn}
                    onPress={() => startRest(exIdx, setIdx)}
                  >
                    <Text style={styles.restBtnText}>Descanso</Text>
                  </TouchableOpacity>
                </View>
              );
            })}
          </AppCard>
        );
      })}

      <View style={styles.bottom} />

      <Modal visible={showPostWorkoutSummary} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Resumo da sessão</Text>
            {postWorkoutData && (
              <>
                <Text style={styles.modalVolume}>
                  Volume total: {postWorkoutData.volumeTotal.toLocaleString('pt-BR')} kg
                </Text>
                {postWorkoutData.volumePrevious > 0 && (
                  <Text style={styles.modalCompare}>
                    {postWorkoutData.volumeTotal >= postWorkoutData.volumePrevious
                      ? `Volume ${((postWorkoutData.volumeTotal / postWorkoutData.volumePrevious - 1) * 100).toFixed(0)}% ↑ vs sessão anterior`
                      : `Volume ${((1 - postWorkoutData.volumeTotal / postWorkoutData.volumePrevious) * 100).toFixed(0)}% ↓ vs sessão anterior`}
                  </Text>
                )}
                {postWorkoutData.e1rmByExercise.length > 0 && (
                  <>
                    <Text style={styles.modalSubtitle}>1RM estimado (Epley)</Text>
                    {postWorkoutData.e1rmByExercise.map((e, i) => (
                      <Text key={i} style={styles.modalE1rm}>{e.name}: {e.e1rm} kg</Text>
                    ))}
                  </>
                )}
              </>
            )}
            <TouchableOpacity style={styles.modalButton} onPress={handleClosePostWorkoutSummary}>
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showPostWorkoutFeedback} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Como foi o treino?</Text>
            <Text style={styles.feedbackHint}>Seu treinador pode usar esse feedback para ajustar seus próximos treinos.</Text>
            <TouchableOpacity
              style={styles.feedbackOption}
              onPress={() => saveWorkoutFeedback('easy')}
            >
              <Text style={styles.feedbackOptionText}>Fácil</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.feedbackOption}
              onPress={() => saveWorkoutFeedback('ok')}
            >
              <Text style={styles.feedbackOptionText}>No limite</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.feedbackOption}
              onPress={() => saveWorkoutFeedback('hard')}
            >
              <Text style={styles.feedbackOptionText}>Muito difícil</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.feedbackSkip} onPress={skipWorkoutFeedback}>
              <Text style={styles.feedbackSkipText}>Pular</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  error: { color: colors.error, fontSize: 16 },
  backBtn: { marginTop: spacing.lg },
  backBtnText: { color: colors.primary, fontSize: 16 },
  workoutHeader: { marginBottom: spacing.sm },
  headerFinishBtn: { marginTop: spacing.md },
  title: { ...typography.titleSmall, color: colors.text },
  workoutMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  durationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  durationText: { fontSize: 13, color: colors.textMuted },
  progressText: { fontSize: 13, color: colors.textMuted },
  dayTabs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
  dayTab: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
  },
  dayTabActive: { backgroundColor: colors.primary },
  dayTabText: { fontSize: 14, color: colors.textSecondary },
  dayTabTextActive: { color: '#fff', fontWeight: '600' },
  sectionTitle: {
    ...typography.sectionTitle,
    color: colors.textMuted,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  sectionHint: {
    ...typography.caption,
    color: colors.textSubtle,
    marginBottom: spacing.md,
  },
  exCard: {
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  exName: { fontSize: 16, fontWeight: '600', color: colors.text },
  exSuggested: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: spacing.md },
  restBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  restText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  restActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  restAdd30: { paddingVertical: 4, paddingHorizontal: 8 },
  restSkip: { paddingVertical: 4, paddingHorizontal: 8 },
  restSkipText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  lastLoadText: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  firstTimeText: { fontSize: 13, color: colors.textSubtle, fontStyle: 'italic', marginTop: 2 },
  newPRBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  newPRBadge: { fontSize: 13, color: colors.warning, fontWeight: '700' },
  checkIcon: {},
  prText: { fontSize: 13, color: colors.primary, marginTop: 2, marginBottom: 2 },
  suggestionBanner: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.sm,
    borderLeftWidth: 4,
  },
  suggestionIncrease: { backgroundColor: colors.successLight, borderLeftColor: colors.success },
  suggestionDecrease: { backgroundColor: colors.primaryLight, borderLeftColor: colors.primary },
  suggestionText: { fontSize: 14, color: colors.text, fontWeight: '500' },
  suggestionDisclaimer: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.lg },
  modalVolume: { fontSize: 16, fontWeight: '600', color: colors.primary, marginBottom: spacing.sm },
  modalCompare: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.md },
  modalSubtitle: { fontSize: 14, fontWeight: '600', color: colors.textMuted, marginTop: spacing.sm, marginBottom: spacing.xs },
  modalE1rm: { fontSize: 14, color: colors.text, marginBottom: 2 },
  modalButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  modalButtonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  feedbackHint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg, lineHeight: 18 },
  feedbackOption: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  feedbackOptionText: { fontSize: 16, color: colors.text, fontWeight: '500' },
  feedbackSkip: { marginTop: spacing.md, alignItems: 'center' },
  feedbackSkipText: { fontSize: 14, color: colors.textMuted },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  restBtn: {
    marginLeft: spacing.sm,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: colors.surfaceElevated,
    borderRadius: radius.sm,
  },
  restBtnText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.borderLight,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  setLabel: { width: 56, fontSize: 14, color: colors.textMuted },
  setInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    marginLeft: spacing.sm,
    minWidth: 0,
  },
  bottom: { height: spacing.xxl },
  });
}
