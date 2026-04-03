import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, typography, touchTargetMin } from '../theme';
import { AppCard } from '../components/ui/AppCard';
import { AppScreen } from '../components/ui/AppScreen';
import { QUICK_WORKOUTS, type QuickWorkout } from '../services/quickWorkouts';

function focusColor(focus: QuickWorkout['focus']) {
  if (focus === 'forca') return 'barbell-outline';
  if (focus === 'cardio') return 'flash-outline';
  if (focus === 'mobilidade') return 'body-outline';
  return 'leaf-outline';
}

export function QuickWorkoutsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [selected, setSelected] = useState<QuickWorkout | null>(null);

  return (
    <AppScreen style={styles.container} scrollable contentContainerStyle={styles.content}>
      <AppCard style={styles.heroCard}>
        <Text style={styles.kicker}>BIBLIOTECA EXTRA</Text>
        <Text style={styles.heroTitle}>Treinos rapidos</Text>
        <Text style={styles.heroSubtitle}>Opcao para dias corridos, sem equipamento ou foco em recuperacao.</Text>
      </AppCard>

      {QUICK_WORKOUTS.map((workout) => (
        <TouchableOpacity key={workout.id} activeOpacity={0.85} onPress={() => setSelected(workout)}>
          <AppCard style={styles.card}>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{workout.name}</Text>
              <Ionicons name={focusColor(workout.focus)} size={18} color={colors.primary} />
            </View>
            <Text style={styles.meta}>
              {workout.durationMin} min · {workout.level} · {workout.equipment}
            </Text>
            <Text style={styles.metaCaps}>{workout.focus}</Text>
          </AppCard>
        </TouchableOpacity>
      ))}

      {selected && (
        <AppCard style={styles.detailCard}>
          <Text style={styles.detailTitle}>Estrutura: {selected.name}</Text>
          {selected.exercises.map((exercise, idx) => (
            <View key={`${selected.id}-${idx}`} style={styles.exerciseRow}>
              <Text style={styles.exerciseBullet}>•</Text>
              <Text style={styles.exerciseText}>{exercise}</Text>
            </View>
          ))}
          <TouchableOpacity style={styles.detailButton} onPress={() => setSelected(null)}>
            <Text style={styles.detailButtonText}>Fechar detalhe</Text>
          </TouchableOpacity>
        </AppCard>
      )}

      <View style={styles.bottom} />
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    heroCard: { marginBottom: spacing.lg },
    kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.textSubtle, marginBottom: spacing.xs },
    heroTitle: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.xs },
    heroSubtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    card: { marginBottom: spacing.md },
    rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    meta: { marginTop: spacing.xs, color: colors.textMuted, fontSize: 13 },
    metaCaps: { marginTop: spacing.xs, color: colors.primary, fontSize: 12, textTransform: 'uppercase', fontWeight: '700' },
    detailCard: { marginTop: spacing.md },
    detailTitle: { ...typography.sectionTitle, color: colors.textSecondary, marginBottom: spacing.md },
    exerciseRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
    exerciseBullet: { fontSize: 14, color: colors.primary },
    exerciseText: { fontSize: 14, color: colors.text },
    detailButton: {
      marginTop: spacing.md,
      minHeight: touchTargetMin,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surfaceElevated,
    },
    detailButtonText: { fontSize: 14, color: colors.textMuted, fontWeight: '600' },
    bottom: { height: spacing.xl },
  });
}
