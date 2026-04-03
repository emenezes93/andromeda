import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMyTrainingPlan } from '../api/training';
import type { TrainingPlanDetail, ExerciseMedia } from '../types';
import { ExerciseMedia as ExerciseMediaComponent } from '../components/ExerciseMedia';
import { spacing, radius, typography } from '../theme';
import { AppCard } from '../components/ui/AppCard';
import { AppScreen } from '../components/ui/AppScreen';
import { Button } from '../components/ui/Button';
import { SkeletonBlock } from '../components/ui/SkeletonBlock';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

interface PlanJsonExercise extends ExerciseMedia {
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

export function TrainingPlanDetailScreen({
  route,
  navigation,
}: {
  route: { params: { id: string } };
  navigation: { navigate: (a: string, b?: object) => void };
}) {
  const { token, tenantId } = useAuth();
  const { colors } = useTheme();
  const layout = useResponsiveLayout();
  const styles = useMemo(() => createStyles(colors, layout), [colors, layout]);
  const [plan, setPlan] = useState<TrainingPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!token || !tenantId) return;
    getMyTrainingPlan(route.params.id, token, tenantId)
      .then((p) => {
        if (!cancelled) setPlan(p);
      })
      .catch(() => {
        if (!cancelled) setPlan(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, tenantId, route.params.id]);

  const handleStartWorkout = () => {
    navigation.navigate('ActiveWorkout', { planId: route.params.id, planName: plan?.name });
  };

  const handleLogWorkout = () => {
    navigation.navigate('LogWorkout', { planId: route.params.id, planName: plan?.name });
  };

  const handleExportPdf = async () => {
    if (!plan) return;
    const planJson = plan.planJson as { days?: PlanJsonDay[] } | undefined;
    const days = planJson?.days ?? [];
    const htmlParts: string[] = [
      '<!DOCTYPE html><html><head><meta charset="utf-8"><style>',
      'body{font-family:system-ui,sans-serif;padding:20px;color:#1e293b;}',
      'h1{font-size:22px;margin-bottom:8px;}',
      'h2{font-size:16px;margin-top:20px;margin-bottom:8px;color:#475569;}',
      'p{margin:4px 0;}',
      '.ex{margin-left:12px;margin-bottom:8px;}',
      '.meta{color:#64748b;font-size:14px;}',
      '</style></head><body>',
      `<h1>${escapeHtml(plan.name)}</h1>`,
      plan.description ? `<p class="meta">${escapeHtml(plan.description)}</p>` : '',
      `<p class="meta">Início: ${new Date(plan.startDate).toLocaleDateString('pt-BR')}</p>`,
    ];
    for (const day of days) {
      htmlParts.push(`<h2>${escapeHtml(day.dayLabel ?? 'Dia')}</h2>`);
      for (const ex of day.exercises ?? []) {
        const detail = [ex.sets && `${ex.sets} séries`, ex.reps && `${ex.reps} reps`, ex.rest && `${ex.rest} descanso`].filter(Boolean).join(' · ');
        htmlParts.push(`<div class="ex"><strong>${escapeHtml(ex.name ?? 'Exercício')}</strong>${detail ? ` — ${escapeHtml(detail)}` : ''}</div>`);
      }
    }
    htmlParts.push('</body></html>');
    const html = htmlParts.join('');
    try {
      const { uri } = await Print.printToFileAsync({ html });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Exportar ${plan.name}` });
      } else {
        Alert.alert('PDF gerado', `Arquivo salvo em: ${uri}`);
      }
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível gerar o PDF.');
    }
  };

  function escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  if (loading) {
    return (
      <AppScreen scrollable contentContainerStyle={styles.content}>
        <AppCard style={styles.heroCard}>
          <SkeletonBlock style={styles.skeletonTitle} />
          <SkeletonBlock style={styles.skeletonLine} />
          <SkeletonBlock style={styles.skeletonLineShort} />
          <SkeletonBlock style={styles.skeletonButton} />
          <SkeletonBlock style={styles.skeletonButton} />
        </AppCard>
        <AppCard style={styles.dayCard}>
          <SkeletonBlock style={styles.skeletonDayTitle} />
          <SkeletonBlock style={styles.skeletonExerciseLine} />
          <SkeletonBlock style={styles.skeletonExerciseLineShort} />
          <SkeletonBlock style={styles.skeletonExerciseLine} />
        </AppCard>
      </AppScreen>
    );
  }

  if (!plan) {
    return (
      <AppScreen>
        <View style={styles.centered}>
          <Text style={styles.error}>Plano não encontrado.</Text>
        </View>
      </AppScreen>
    );
  }

  const planJson = plan.planJson as { days?: PlanJsonDay[] } | undefined;
  const days = planJson?.days ?? [];
  const rawExecutions = ((plan as unknown as { executions?: Array<{ coachNotes?: string | null; executedAt?: string }>; recentExecutions?: Array<{ coachNotes?: string | null; executedAt?: string }> }).executions
    ?? (plan as unknown as { recentExecutions?: Array<{ coachNotes?: string | null; executedAt?: string }> }).recentExecutions
    ?? []);
  const coachNotes = rawExecutions
    .filter((ex) => typeof ex?.coachNotes === 'string' && ex.coachNotes.trim().length > 0)
    .slice(0, 3);

  return (
    <AppScreen
      style={styles.container}
      scrollable
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppCard style={styles.heroCard}>
        <Text style={styles.kicker}>PLANO DE TREINO</Text>
        <Text style={styles.title}>{plan.name}</Text>
        {plan.description ? (
          <Text style={styles.description}>{plan.description}</Text>
        ) : null}
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Início: {new Date(plan.startDate).toLocaleDateString('pt-BR')}
          </Text>
          {plan.endDate && (
            <Text style={styles.metaText}>
              Término: {new Date(plan.endDate).toLocaleDateString('pt-BR')}
            </Text>
          )}
          <Text style={styles.metaText}>{plan.executionsCount} treinos realizados</Text>
        </View>
        <Button
          title="Iniciar treino"
          onPress={handleStartWorkout}
          style={styles.primaryButton}
          accessibilityLabel="Iniciar treino"
        />
        <Button
          title="Registrar sem checklist"
          variant="secondary"
          onPress={handleLogWorkout}
          style={styles.secondaryButton}
          accessibilityLabel="Registrar treino sem checklist"
        />
        <Button
          title="Exportar plano em PDF"
          variant="ghost"
          onPress={handleExportPdf}
          accessibilityLabel="Exportar plano em PDF"
        />
      </AppCard>

      {coachNotes.length > 0 && (
        <AppCard style={styles.notesCard}>
          <View style={styles.noteHeader}>
            <Text style={styles.noteLabel}>Nota do seu profissional</Text>
          </View>
          {coachNotes.map((ex, idx) => (
            <View key={`${ex.executedAt || 'note'}-${idx}`} style={[styles.noteItem, idx === coachNotes.length - 1 && styles.noteItemLast]}>
              <Text style={styles.noteText}>{ex.coachNotes}</Text>
              {ex.executedAt ? (
                <Text style={styles.noteDate}>
                  {new Date(ex.executedAt).toLocaleDateString('pt-BR')}
                </Text>
              ) : null}
            </View>
          ))}
        </AppCard>
      )}

      {days.length === 0 ? (
        <Text style={styles.empty}>Nenhum dia de treino definido neste plano.</Text>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Dias de treino</Text>
          {days.map((day, idx) => (
            <AppCard key={idx} style={styles.dayCard} padded={false}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{day.dayLabel || `Dia ${idx + 1}`}</Text>
              </View>
              {(day.exercises ?? []).map((ex, i) => (
                <View key={i} style={styles.exBlock}>
                  <ExerciseMediaComponent
                    gifUrl={ex.gifUrl}
                    imageUrl={ex.imageUrl}
                    exerciseName={ex.name}
                  />
                  <View style={styles.exRow}>
                    <View style={styles.exBullet} />
                    <View style={styles.exContent}>
                      <Text style={styles.exName}>{ex.name || 'Exercício'}</Text>
                      <Text style={styles.exDetail}>
                        {[ex.sets && `${ex.sets} séries`, ex.reps && `${ex.reps} reps`, ex.rest && `${ex.rest} descanso`]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                      {ex.muscleGroup ? (
                        <Text style={styles.exGroup}>{ex.muscleGroup}</Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </AppCard>
          ))}
        </>
      )}
    </AppScreen>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  layout: ReturnType<typeof useResponsiveLayout>
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: layout.contentPadding, paddingBottom: spacing.xxl },
    centered: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
    },
    error: { color: colors.error, fontSize: 16 },
    heroCard: { marginBottom: spacing.xl },
    kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.textSubtle, marginBottom: spacing.xs },
    title: { ...typography.titleSmall, fontSize: layout.titleSize + 2, color: colors.text },
    description: {
      fontSize: 15,
      color: colors.textMuted,
      marginTop: spacing.sm,
      lineHeight: 22,
    },
    metaRow: { marginTop: spacing.md, marginBottom: spacing.lg },
    metaText: { fontSize: 14, color: colors.textSubtle },
    primaryButton: {
      marginBottom: spacing.sm,
    },
    secondaryButton: {
      marginBottom: spacing.sm,
    },
    empty: { color: colors.textMuted, marginTop: spacing.xl, textAlign: 'center' },
    sectionTitle: {
      ...typography.sectionTitle,
      color: colors.textMuted,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    dayCard: {
      marginBottom: spacing.lg,
      padding: spacing.lg,
    },
    notesCard: {
      marginBottom: spacing.lg,
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
      borderWidth: 1,
    },
    noteHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
    noteLabel: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
    noteItem: { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    noteItemLast: { borderBottomWidth: 0, paddingBottom: 0 },
    noteText: { fontSize: 14, color: colors.text, lineHeight: 20 },
    noteDate: { marginTop: spacing.xs, fontSize: 12, color: colors.textMuted },
    dayHeader: { marginBottom: spacing.md },
    dayTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    exBlock: {
      marginBottom: spacing.lg,
    },
    exRow: {
      flexDirection: 'row',
    },
    exBullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.primary,
      marginTop: 8,
      marginRight: spacing.md,
    },
    exContent: { flex: 1 },
    exName: { fontSize: 15, color: colors.text, fontWeight: '500' },
    exDetail: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    exGroup: { fontSize: 12, color: colors.textSubtle, marginTop: 2 },
    skeletonTitle: { height: 24, width: '62%', marginBottom: spacing.sm },
    skeletonLine: { height: 14, width: '100%', marginBottom: spacing.xs },
    skeletonLineShort: { height: 14, width: '75%', marginBottom: spacing.lg },
    skeletonButton: { height: 48, width: '100%', marginBottom: spacing.sm },
    skeletonDayTitle: { height: 18, width: '45%', marginBottom: spacing.md },
    skeletonExerciseLine: { height: 14, width: '100%', marginBottom: spacing.sm },
    skeletonExerciseLineShort: { height: 14, width: '68%', marginBottom: spacing.sm },
  });
}
