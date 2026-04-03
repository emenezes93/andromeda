import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getBadges, getStreaks } from '../storage/achievements';
import type { Badge, StreakInfo } from '../storage/achievements';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { AppCard } from '../components/ui/AppCard';
import { AppScreen } from '../components/ui/AppScreen';

export function AchievementsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [streaks, setStreaks] = useState<StreakInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const [b, s] = await Promise.all([getBadges(), getStreaks()]);
    setBadges(b);
    setStreaks(s);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <AppScreen
      style={styles.container}
      scrollable
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false); }} colors={[colors.primary]} tintColor={colors.primary} />
      }
    >
      <AppCard style={styles.heroCard}>
        <Text style={styles.kicker}>PROGRESSO</Text>
        <Text style={styles.heroTitle}>Conquistas e consistência</Text>
        <Text style={styles.heroSubtitle}>Mantenha sua frequência para desbloquear novos marcos.</Text>
      </AppCard>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sequências atuais</Text>
        {streaks.length === 0 ? (
          <Text style={styles.hint}>Registre treinos e água para ver suas sequências.</Text>
        ) : (
          streaks.map((s) => (
            <View key={s.type} style={styles.streakCard}>
              <Text style={styles.streakLabel}>{s.label}</Text>
              <Text style={styles.streakValue}>{s.currentCount} dias</Text>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Conquistas</Text>
        {badges.map((b) => (
          <View key={b.id} style={[styles.badgeCard, !b.unlockedAt && styles.badgeLocked]}>
            <Ionicons
              name={b.iconName as React.ComponentProps<typeof Ionicons>['name']}
              size={32}
              color={b.unlockedAt ? colors.primary : colors.textMuted}
              style={styles.badgeIcon}
            />
            <View style={styles.badgeContent}>
              <Text style={styles.badgeName}>{b.name}</Text>
              <Text style={styles.badgeDesc}>{b.description}</Text>
              {b.unlockedAt ? (
                <Text style={styles.badgeDate}>
                  Desbloqueado em {new Date(b.unlockedAt).toLocaleDateString('pt-BR')}
                </Text>
              ) : (
                <Text style={styles.badgeLockedText}>Em progresso</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    heroCard: { marginBottom: spacing.xl },
    kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.textSubtle, marginBottom: spacing.xs },
    heroTitle: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.xs },
    heroSubtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    section: { marginBottom: spacing.xl },
    sectionTitle: { ...typography.sectionTitle, color: colors.textSecondary, marginBottom: spacing.md },
    hint: { fontSize: 14, color: colors.textMuted },
    streakCard: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    streakLabel: { fontSize: 15, color: colors.text },
    streakValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
    badgeCard: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    badgeLocked: { opacity: 0.7 },
    badgeIcon: { marginRight: spacing.lg },
    badgeContent: { flex: 1 },
    badgeName: { fontSize: 16, fontWeight: '600', color: colors.text },
    badgeDesc: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
    badgeDate: { fontSize: 12, color: colors.success, marginTop: 4 },
    badgeLockedText: { fontSize: 12, color: colors.textSubtle, marginTop: 4 },
  });
}
