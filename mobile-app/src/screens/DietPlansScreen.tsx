import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMyDietPlans } from '../api/diet';
import type { DietPlanSummary } from '../types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { spacing, radius, touchTargetMin, typography } from '../theme';
import { EmptyState } from '../components/ui/EmptyState';
import { AppCard } from '../components/ui/AppCard';
import { Button } from '../components/ui/Button';
import { SkeletonBlock } from '../components/ui/SkeletonBlock';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export function DietPlansScreen({
  navigation,
}: {
  navigation: { navigate: (a: string, b?: { id: string }) => void };
}) {
  const goDaily = () => navigation.navigate('DailyLog');
  const { token, tenantId } = useAuth();
  const { colors } = useTheme();
  const layout = useResponsiveLayout();
  const [plans, setPlans] = useState<DietPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (refresh = false) => {
      if (!token || !tenantId) return;
      setError(false);
      if (refresh) setRefreshing(true);
      else setLoading(true);
      try {
        const res = await getMyDietPlans(token, tenantId, { limit: 50, active: true });
        setPlans(res.data ?? []);
      } catch {
        setPlans([]);
        setError(true);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, tenantId]
  );

  useEffect(() => {
    load();
  }, [load]);

  const styles = useMemo(() => createStyles(colors, layout), [colors, layout]);

  if (loading && plans.length === 0 && !error) {
    return (
      <View style={styles.container}>
        <View style={styles.list}>
          <AppCard style={styles.heroCard}>
            <SkeletonBlock style={styles.skeletonHeroTitle} />
            <SkeletonBlock style={styles.skeletonHeroLine} />
            <SkeletonBlock style={styles.skeletonHeroLineShort} />
            <SkeletonBlock style={styles.skeletonHeroButton} />
          </AppCard>
          <AppCard style={styles.skeletonItem}>
            <SkeletonBlock style={styles.skeletonItemTitle} />
            <SkeletonBlock style={styles.skeletonItemLine} />
            <View style={styles.skeletonChipRow}>
              <SkeletonBlock style={styles.skeletonChip} />
              <SkeletonBlock style={styles.skeletonChip} />
              <SkeletonBlock style={styles.skeletonChip} />
            </View>
          </AppCard>
          <AppCard style={styles.skeletonItem}>
            <SkeletonBlock style={styles.skeletonItemTitle} />
            <SkeletonBlock style={styles.skeletonItemLine} />
            <View style={styles.skeletonChipRow}>
              <SkeletonBlock style={styles.skeletonChip} />
              <SkeletonBlock style={styles.skeletonChip} />
            </View>
          </AppCard>
        </View>
      </View>
    );
  }

  if (error && plans.length === 0) {
    return (
      <EmptyState
        iconName="cloud-offline"
        title="Falha ao carregar"
        subtitle="Não foi possível carregar as dietas. Verifique sua conexão e tente novamente."
        actionLabel="Tentar novamente"
        onAction={() => load()}
      />
    );
  }

  if (plans.length === 0) {
    return (
      <EmptyState
        iconName="nutrition"
        title="Nenhuma dieta encaminhada"
        subtitle="As dietas que seu nutricionista ou treinador enviarem aparecerão aqui. Quando houver planos ativos, você verá as metas e orientações."
        actionLabel="Registrar água e refeições"
        onAction={goDaily}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={plans}
        keyExtractor={(item) => item.id}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <AppCard style={styles.heroCard}>
              <Text style={styles.kicker}>DIETA</Text>
              <Text style={styles.heroTitle}>Rotina alimentar</Text>
              <Text style={styles.heroSubtitle}>
                Registre água e refeições do dia para acompanhar sua aderência e evolução.
              </Text>
              <Button
                title="Registrar água e refeições"
                onPress={goDaily}
                accessibilityLabel="Registrar água e refeições"
              />
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipValue}>{plans.length}</Text>
                  <Text style={styles.metaChipLabel}>Planos ativos</Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipValue}>
                    {plans.filter((p) => p.caloriesKcal != null).length}
                  </Text>
                  <Text style={styles.metaChipLabel}>Com metas de kcal</Text>
                </View>
              </View>
            </AppCard>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('DietPlanDetail', { id: item.id })}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={`Abrir plano ${item.name}`}
          >
            <View style={styles.cardAccent} />
            <View style={styles.cardMain}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              {(item.caloriesKcal != null || item.proteinG != null) && (
                <View style={styles.macros}>
                  {item.caloriesKcal != null && (
                    <View style={styles.macroChip}>
                      <Text style={styles.macroChipText}>{item.caloriesKcal} kcal</Text>
                    </View>
                  )}
                  {item.proteinG != null && (
                    <View style={styles.macroChip}>
                      <Text style={styles.macroChipText}>P {item.proteinG}g</Text>
                    </View>
                  )}
                  {item.carbsG != null && (
                    <View style={styles.macroChip}>
                      <Text style={styles.macroChipText}>C {item.carbsG}g</Text>
                    </View>
                  )}
                  {item.fatG != null && (
                    <View style={styles.macroChip}>
                      <Text style={styles.macroChipText}>G {item.fatG}g</Text>
                    </View>
                  )}
                </View>
              )}
              <View style={styles.cardFooter}>
                <View style={[styles.badge, item.active ? styles.badgeActive : styles.badgeInactive]}>
                  <Text style={[styles.badgeText, !item.active && styles.badgeTextInactive]}>
                    {item.active ? 'Ativo' : 'Encerrado'}
                  </Text>
                </View>
              </View>
            </View>
            <View style={styles.chevronPill}>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>['colors'],
  layout: ReturnType<typeof useResponsiveLayout>
) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: {
      flex: 1,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.xl,
    },
    listHeader: { marginBottom: spacing.lg },
    heroCard: { marginBottom: spacing.sm },
    kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.textSubtle, marginBottom: spacing.xs },
    heroTitle: {
      ...typography.titleSmall,
      color: colors.text,
      marginBottom: spacing.xs,
    },
    heroSubtitle: {
      fontSize: 14,
      color: colors.textMuted,
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    metaRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    metaChip: {
      flex: 1,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    metaChipValue: { fontSize: 16, fontWeight: '700', color: colors.text },
    metaChipLabel: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    list: { padding: layout.contentPadding, paddingBottom: spacing.listBottom },
    skeletonHeroTitle: { height: 22, width: '55%', marginBottom: spacing.sm },
    skeletonHeroLine: { height: 14, width: '100%', marginBottom: spacing.xs },
    skeletonHeroLineShort: { height: 14, width: '72%', marginBottom: spacing.lg },
    skeletonHeroButton: { height: 48, width: '100%' },
    skeletonItem: { marginBottom: spacing.md },
    skeletonItemTitle: { height: 18, width: '62%', marginBottom: spacing.sm },
    skeletonItemLine: { height: 14, width: '100%', marginBottom: spacing.sm },
    skeletonChipRow: { flexDirection: 'row', gap: spacing.sm },
    skeletonChip: { height: 26, width: 64, borderRadius: radius.full },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      minHeight: 72,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardAccent: {
      width: 4,
      alignSelf: 'stretch',
      borderRadius: radius.full,
      backgroundColor: colors.accent,
      marginRight: spacing.md,
    },
    cardMain: { flex: 1 },
    cardTitle: {
      fontSize: layout.titleSize,
      fontWeight: '600',
      color: colors.text,
    },
    cardDesc: {
      fontSize: layout.bodySize,
      color: colors.textMuted,
      marginTop: spacing.xs,
      lineHeight: layout.bodySize + 6,
    },
    macros: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.md },
    macroChip: {
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    macroChipText: { fontSize: 12, color: colors.textMuted },
    cardFooter: { marginTop: spacing.md },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
      alignSelf: 'flex-start',
    },
    badgeActive: { backgroundColor: colors.successLight },
    badgeInactive: { backgroundColor: colors.surfaceElevated },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
    },
    badgeTextInactive: { color: colors.textMuted },
    chevronPill: {
      width: 30,
      height: 30,
      borderRadius: radius.full,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center',
      marginLeft: spacing.sm,
    },
  });
}
