import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import { getWorkoutLogs, computeVolumeFromLog, computeE1rmFromLog } from '../storage/workoutLogs';
import type { SavedWorkoutLog } from '../types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, typography } from '../theme';
import { EvolutionChart, type EvolutionChartPeriod } from '../components/EvolutionChart';
import { AppCard } from '../components/ui/AppCard';
import { AppScreen } from '../components/ui/AppScreen';
import { Button } from '../components/ui/Button';

export function WorkoutHistoryScreen({
  navigation,
}: {
  navigation: { navigate: (a: string, b?: object) => void };
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [logs, setLogs] = useState<SavedWorkoutLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [detail, setDetail] = useState<SavedWorkoutLog | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<EvolutionChartPeriod>(90);
  const [chartExercise, setChartExercise] = useState<string | null>(null);

  const load = async () => {
    const list = await getWorkoutLogs();
    setLogs(list);
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const sortedLogs = useMemo(() => [...logs].sort((a, b) => a.executedAt.localeCompare(b.executedAt)), [logs]);
  const volumeChartData = useMemo(
    () =>
      sortedLogs.map((log) => ({
        date: log.executedAt.slice(0, 10),
        value: computeVolumeFromLog(log.exercises),
      })),
    [sortedLogs]
  );
  const exerciseNames = useMemo(() => {
    const set = new Set<string>();
    for (const log of logs) {
      for (const ex of log.exercises) {
        const e1rmList = computeE1rmFromLog([ex]);
        if (e1rmList.length > 0) set.add(ex.exerciseName);
      }
    }
    return Array.from(set).sort();
  }, [logs]);
  const e1rmChartData = useMemo(() => {
    if (!chartExercise) return [];
    return sortedLogs
      .map((log) => {
        const e1rms = computeE1rmFromLog(log.exercises);
        const match = e1rms.find((e) => e.name === chartExercise);
        return match ? { date: log.executedAt.slice(0, 10), value: match.e1rm } : null;
      })
      .filter((p): p is { date: string; value: number } => p != null);
  }, [sortedLogs, chartExercise]);

  const header = (
    <>
      <AppCard style={styles.heroCard}>
        <Text style={styles.kicker}>TREINOS</Text>
        <Text style={styles.heroTitle}>Histórico de treinos</Text>
        <Text style={styles.heroSubtitle}>
          Revise suas sessões e acompanhe a progressão de volume e 1RM ao longo do tempo.
        </Text>
        <Button
          title={showChart ? 'Ocultar gráficos' : 'Ver gráficos de evolução'}
          variant={showChart ? 'secondary' : 'primary'}
          onPress={() => setShowChart((v) => !v)}
          accessibilityLabel={showChart ? 'Ocultar gráficos de evolução' : 'Ver gráficos de evolução'}
        />
      </AppCard>
      {showChart && (
        <AppCard style={styles.chartSection}>
          <Text style={styles.chartSectionTitle}>Volume total por sessão</Text>
          <EvolutionChart
            data={volumeChartData}
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
            yAxisSuffix=" kg"
          />
          {exerciseNames.length > 0 && (
            <>
              <Text style={styles.chartSectionTitle}>1RM estimado por exercício</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.exerciseChips}>
                <TouchableOpacity
                  style={[styles.exerciseChip, !chartExercise && styles.exerciseChipActive]}
                  onPress={() => setChartExercise(null)}
                >
                  <Text style={[styles.exerciseChipText, !chartExercise && styles.exerciseChipTextActive]}>
                    Nenhum
                  </Text>
                </TouchableOpacity>
                {exerciseNames.map((name) => (
                  <TouchableOpacity
                    key={name}
                    style={[styles.exerciseChip, chartExercise === name && styles.exerciseChipActive]}
                    onPress={() => setChartExercise(name)}
                  >
                    <Text style={[styles.exerciseChipText, chartExercise === name && styles.exerciseChipTextActive]} numberOfLines={1}>
                      {name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {chartExercise && e1rmChartData.length >= 2 && (
                <EvolutionChart
                  data={e1rmChartData}
                  period={chartPeriod}
                  onPeriodChange={setChartPeriod}
                  yAxisSuffix=" kg"
                />
              )}
            </>
          )}
        </AppCard>
      )}
    </>
  );

  if (logs.length === 0) {
    return (
      <AppScreen>
        <View style={styles.centered}>
          <AppCard>
            <Text style={styles.emptyTitle}>Nenhum treino no histórico</Text>
            <Text style={styles.emptySubtitle}>
              Ao finalizar um treino com checklist, ele aparecerá aqui.
            </Text>
            <Button
              title="Iniciar treino"
              onPress={() => navigation.navigate('TrainingList')}
              accessibilityLabel="Iniciar treino"
            />
          </AppCard>
        </View>
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => {
          const date = new Date(item.executedAt);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setDetail(item)}
              activeOpacity={0.85}
            >
              <Text style={styles.cardTitle}>{item.planName}</Text>
              <Text style={styles.cardDay}>{item.dayLabel}</Text>
              <View style={styles.cardRow}>
                <Text style={styles.cardDate}>
                  {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </Text>
                {item.durationMinutes != null && (
                  <Text style={styles.cardDuration}>{item.durationMinutes} min</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <Modal
        visible={detail != null}
        transparent
        animationType="fade"
        onRequestClose={() => setDetail(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDetail(null)}
        >
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setDetail(null)}>
              <Text style={styles.modalCloseText}>Fechar</Text>
            </TouchableOpacity>
            {detail && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalTitle}>{detail.planName}</Text>
                <Text style={styles.modalDay}>{detail.dayLabel}</Text>
                <Text style={styles.modalMeta}>
                  {new Date(detail.executedAt).toLocaleString('pt-BR')}
                  {detail.durationMinutes != null && ` · ${detail.durationMinutes} min`}
                </Text>
                {detail.exercises.map((ex, idx) => (
                  <View key={idx} style={styles.modalEx}>
                    <Text style={styles.modalExName}>{ex.exerciseName}</Text>
                    {ex.sets.map((s, i) => (
                      <View key={i} style={styles.modalSetRow}>
                        <View style={styles.modalSetLabelRow}>
                          <Text style={styles.modalSetLabel}>Série {i + 1}: </Text>
                          {s.completed ? (
                            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                          ) : (
                            <Text style={styles.modalSetDash}>—</Text>
                          )}
                        </View>
                        {(s.weightKg != null || s.reps != null) && (
                          <Text style={styles.modalSetValues}>
                            {s.weightKg != null && `${s.weightKg} kg`}
                            {s.weightKg != null && s.reps != null && ' · '}
                            {s.reps != null && `${s.reps} reps`}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.lg, paddingBottom: spacing.xxl },
    heroCard: { marginBottom: spacing.md },
    kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.textSubtle, marginBottom: spacing.xs },
    heroTitle: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.xs },
    heroSubtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.lg },
    chartSection: { marginBottom: spacing.xl },
    chartSectionTitle: {
      ...typography.sectionTitle,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    exerciseChips: { marginBottom: spacing.md, maxHeight: 44 },
    exerciseChip: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: spacing.sm,
    },
    exerciseChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    exerciseChipText: { fontSize: 13, color: colors.textMuted, maxWidth: 140 },
    exerciseChipTextActive: { color: colors.primary, fontWeight: '600' },
    centered: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    emptyTitle: { ...typography.titleSmall, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
    emptySubtitle: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.lg },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
    cardDay: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
    cardRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
    cardDate: { fontSize: 13, color: colors.textSubtle },
    cardDuration: { fontSize: 13, color: colors.primary },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    modalContent: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.xl,
      maxHeight: '80%',
    },
    modalClose: { alignSelf: 'flex-end', marginBottom: spacing.md },
    modalCloseText: { color: colors.primary, fontSize: 16 },
    modalTitle: { ...typography.titleSmall, color: colors.text },
    modalDay: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
    modalMeta: { fontSize: 13, color: colors.textSubtle, marginTop: 4, marginBottom: spacing.lg },
    modalEx: { marginBottom: spacing.lg },
    modalExName: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
    modalSetRow: { flexDirection: 'row', marginTop: 4, paddingLeft: spacing.md },
    modalSetLabelRow: { flexDirection: 'row', alignItems: 'center', width: 80 },
    modalSetLabel: { fontSize: 14, color: colors.textMuted },
    modalSetDash: { fontSize: 14, color: colors.textMuted },
    modalSetValues: { fontSize: 14, color: colors.text },
  });
}
