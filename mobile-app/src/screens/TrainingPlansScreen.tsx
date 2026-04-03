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
import { getMyTrainingPlans } from '../api/training';
import type { TrainingPlanSummary } from '../types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { spacing, radius, typography, touchTargetMin } from '../theme';
import { EmptyState } from '../components/ui/EmptyState';
import { AppCard } from '../components/ui/AppCard';
import { Button } from '../components/ui/Button';
import { SkeletonBlock } from '../components/ui/SkeletonBlock';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

export function TrainingPlansScreen({
  navigation,
}: {
  navigation: { navigate: (a: string, b?: { id: string }) => void };
}) {
  const { token, tenantId } = useAuth();
  const { colors } = useTheme();
  const layout = useResponsiveLayout();
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
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
        const res = await getMyTrainingPlans(token, tenantId, { limit: 50, active: true });
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
            <SkeletonBlock style={styles.skeletonItemLineShort} />
          </AppCard>
          <AppCard style={styles.skeletonItem}>
            <SkeletonBlock style={styles.skeletonItemTitle} />
            <SkeletonBlock style={styles.skeletonItemLine} />
            <SkeletonBlock style={styles.skeletonItemLineShort} />
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
        subtitle="Não foi possível carregar os treinos. Verifique sua conexão e tente novamente."
        actionLabel="Tentar novamente"
        onAction={() => load()}
      />
    );
  }

  if (plans.length === 0) {
    return (
      <EmptyState
        iconName="barbell"
        title="Nenhum treino encaminhado"
        subtitle="Os treinos que seu treinador enviar aparecerão aqui. Quando houver planos ativos, você poderá ver os detalhes e registrar as sessões."
        actionLabel="Abrir treinos rápidos"
        onAction={() => navigation.navigate('QuickWorkouts')}
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
              <Text style={styles.kicker}>TREINOS</Text>
              <Text style={styles.heroTitle}>Treino do dia</Text>
              <Text style={styles.heroSubtitle}>
                Continue sua rotina com o plano mais recente e registre a sessão ao concluir.
              </Text>
              <Button
                title="Abrir treino recomendado"
                onPress={() => navigation.navigate('TrainingPlanDetail', { id: plans[0].id })}
                accessibilityLabel="Abrir treino recomendado"
              />
              <TouchableOpacity
                onPress={() => navigation.navigate('QuickWorkouts')}
                style={styles.historyLinkWrap}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Abrir treinos rápidos"
              >
                <Text style={styles.historyLink}>Abrir treinos rápidos</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate('WorkoutHistory')}
                style={styles.historyLinkWrap}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Ver histórico de treinos"
              >
                <Text style={styles.historyLink}>Ver histórico de treinos</Text>
              </TouchableOpacity>
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipValue}>{plans.length}</Text>
                  <Text style={styles.metaChipLabel}>Planos ativos</Text>
                </View>
                <View style={styles.metaChip}>
                  <Text style={styles.metaChipValue}>
                    {plans.reduce((sum, p) => sum + p.executionsCount, 0)}
                  </Text>
                  <Text style={styles.metaChipLabel}>Treinos concluídos</Text>
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
            onPress={() => navigation.navigate('TrainingPlanDetail', { id: item.id })}
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
              <View style={styles.cardFooter}>
                <View style={[styles.badge, item.active ? styles.badgeActive : styles.badgeInactive]}>
                  <Text style={[styles.badgeText, !item.active && styles.badgeTextInactive]}>
                    {item.active ? 'Ativo' : 'Encerrado'}
                  </Text>
                </View>
                <Text style={styles.count}>{item.executionsCount} treinos realizados</Text>
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
    intro: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
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
    historyLinkWrap: { minHeight: touchTargetMin, justifyContent: 'center', marginBottom: spacing.sm },
    historyLink: {
      fontSize: 14,
      color: colors.primary,
      fontWeight: '600',
    },
    metaRow: { flexDirection: 'row', gap: spacing.sm },
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
    skeletonItemLine: { height: 14, width: '100%', marginBottom: spacing.xs },
    skeletonItemLineShort: { height: 14, width: '65%' },
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
      backgroundColor: colors.primary,
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
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.md,
      gap: spacing.md,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.sm,
    },
    badgeActive: { backgroundColor: colors.successLight },
    badgeInactive: { backgroundColor: colors.surfaceElevated },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.success,
    },
    badgeTextInactive: { color: colors.textMuted },
    count: { fontSize: 13, color: colors.textSubtle },
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
