import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMyDietPlan } from '../api/diet';
import {
  scheduleMealReminders,
  cancelMealReminders,
  getMealReminderPlanId,
  ensureNotificationSetup,
} from '../services/mealReminderNotifications';
import type { DietPlanDetail } from '../types';
import { spacing, radius, typography } from '../theme';
import { AppCard } from '../components/ui/AppCard';
import { AppScreen } from '../components/ui/AppScreen';
import { Button } from '../components/ui/Button';
import { SkeletonBlock } from '../components/ui/SkeletonBlock';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

interface MealItem {
  name: string;
  time: string;
  items: string[];
}

export function DietPlanDetailScreen({
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
  const [plan, setPlan] = useState<DietPlanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [mealReminderPlanId, setMealReminderPlanId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!token || !tenantId) return;
    getMyDietPlan(route.params.id, token, tenantId)
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

  useEffect(() => {
    getMealReminderPlanId().then(setMealReminderPlanId);
  }, []);

  if (loading) {
    return (
      <AppScreen scrollable contentContainerStyle={styles.content}>
        <AppCard style={styles.heroCard}>
          <SkeletonBlock style={styles.skeletonTitle} />
          <SkeletonBlock style={styles.skeletonLine} />
          <SkeletonBlock style={styles.skeletonLineShort} />
          <SkeletonBlock style={styles.skeletonButton} />
        </AppCard>
        <View style={styles.section}>
          <SkeletonBlock style={styles.skeletonSectionTitle} />
          <View style={styles.macrosGrid}>
            <AppCard style={styles.macroCard}>
              <SkeletonBlock style={styles.skeletonMacroValue} />
              <SkeletonBlock style={styles.skeletonMacroLabel} />
            </AppCard>
            <AppCard style={styles.macroCard}>
              <SkeletonBlock style={styles.skeletonMacroValue} />
              <SkeletonBlock style={styles.skeletonMacroLabel} />
            </AppCard>
          </View>
        </View>
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

  const mealPlan = plan.mealPlanJson as { meals?: MealItem[] } | null | undefined;
  const meals = mealPlan?.meals ?? [];
  const hasRemindersForThisPlan = mealReminderPlanId === plan.id;
  const goDailyLog = () => navigation.navigate('DailyLog');

  const activateMealReminders = async () => {
    const ok = await ensureNotificationSetup();
    if (!ok) {
      Alert.alert('Permissão necessária', 'Ative as notificações para receber lembretes de refeição.');
      return;
    }
    await scheduleMealReminders(
      plan.id,
      meals.map((m) => ({ name: m.name, time: m.time })),
      plan.caloriesKcal ?? undefined,
      plan.proteinG ?? undefined
    );
    setMealReminderPlanId(plan.id);
  };

  const deactivateMealReminders = async () => {
    await cancelMealReminders();
    setMealReminderPlanId(null);
  };

  return (
    <AppScreen
      style={styles.container}
      scrollable
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <AppCard style={styles.heroCard}>
        <Text style={styles.kicker}>PLANO ALIMENTAR</Text>
        <Text style={styles.title}>{plan.name}</Text>
        {plan.description ? (
          <Text style={styles.description}>{plan.description}</Text>
        ) : null}
        <Button
          title="Registrar água e refeições hoje"
          onPress={goDailyLog}
          style={styles.primaryButton}
          accessibilityLabel="Registrar água e refeições hoje"
        />
      </AppCard>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Metas diárias</Text>
        <View style={styles.macrosGrid}>
          {plan.caloriesKcal != null && (
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>{plan.caloriesKcal}</Text>
              <Text style={styles.macroLabel}>kcal</Text>
            </View>
          )}
          {plan.proteinG != null && (
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>{plan.proteinG}</Text>
              <Text style={styles.macroLabel}>Proteína (g)</Text>
            </View>
          )}
          {plan.carbsG != null && (
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>{plan.carbsG}</Text>
              <Text style={styles.macroLabel}>Carboidratos (g)</Text>
            </View>
          )}
          {plan.fatG != null && (
            <View style={styles.macroCard}>
              <Text style={styles.macroValue}>{plan.fatG}</Text>
              <Text style={styles.macroLabel}>Gorduras (g)</Text>
            </View>
          )}
          {plan.waterMl != null && (
            <View style={[styles.macroCard, styles.macroCardWater]}>
              <Text style={styles.macroValue}>{plan.waterMl}</Text>
              <Text style={styles.macroLabel}>Água (ml)</Text>
            </View>
          )}
        </View>
      </View>

      {plan.restrictions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Restrições</Text>
          <View style={styles.restrictionsWrap}>
            {plan.restrictions.map((r, i) => (
              <AppCard key={i} style={styles.restrictionChip} padded={false}>
                <Text style={styles.restrictionText}>{r}</Text>
              </AppCard>
            ))}
          </View>
        </View>
      )}

      {meals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sugestão de refeições</Text>
          {!hasRemindersForThisPlan ? (
            <View style={styles.reminderBlock}>
              <Button
                title="Ativar lembretes de refeição"
                variant="secondary"
                onPress={activateMealReminders}
                accessibilityLabel="Ativar lembretes de refeição"
              />
              <Text style={styles.reminderBtnHint}>Notificação no horário de cada refeição</Text>
            </View>
          ) : (
            <View style={styles.reminderBlock}>
              <Button
                title="Desativar lembretes de refeição"
                variant="ghost"
                onPress={deactivateMealReminders}
                accessibilityLabel="Desativar lembretes de refeição"
              />
            </View>
          )}
          {meals.map((meal, idx) => (
            <AppCard key={idx} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealTime}>{meal.time}</Text>
              </View>
              {(meal.items ?? []).map((item, i) => (
                <Text key={i} style={styles.mealItem}>
                  • {item}
                </Text>
              ))}
            </AppCard>
          ))}
        </View>
      )}

      <View style={styles.meta}>
        <Text style={styles.metaText}>
          Início: {new Date(plan.startDate).toLocaleDateString('pt-BR')}
        </Text>
        {plan.endDate && (
          <Text style={styles.metaText}>
            Término: {new Date(plan.endDate).toLocaleDateString('pt-BR')}
          </Text>
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
      marginBottom: spacing.lg,
    },
    primaryButton: {},
    section: { marginTop: spacing.xl },
    sectionTitle: {
      ...typography.sectionTitle,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    macrosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    macroCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      minWidth: 90,
      borderWidth: 1,
      borderColor: colors.border,
    },
    macroCardWater: {
      borderColor: 'rgba(59, 130, 246, 0.3)',
    },
    macroValue: { fontSize: 22, fontWeight: '700', color: colors.text },
    macroLabel: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
    restrictionsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    restrictionChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
    },
    restrictionText: { fontSize: 14, color: colors.textSecondary },
    mealCard: {
      marginBottom: spacing.md,
    },
    mealHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    mealName: { fontSize: 15, fontWeight: '600', color: colors.text },
    mealTime: { fontSize: 14, color: colors.textMuted },
    mealItem: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
      marginTop: 2,
    },
    meta: { marginTop: spacing.xl },
    metaText: { fontSize: 14, color: colors.textSubtle },
    reminderBlock: {
      marginBottom: spacing.lg,
    },
    reminderBtnHint: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
    skeletonTitle: { height: 24, width: '62%', marginBottom: spacing.sm },
    skeletonLine: { height: 14, width: '100%', marginBottom: spacing.xs },
    skeletonLineShort: { height: 14, width: '72%', marginBottom: spacing.lg },
    skeletonButton: { height: 48, width: '100%' },
    skeletonSectionTitle: { height: 14, width: '32%', marginBottom: spacing.md },
    skeletonMacroValue: { height: 22, width: '55%', marginBottom: spacing.sm },
    skeletonMacroLabel: { height: 12, width: '75%' },
  });
}
