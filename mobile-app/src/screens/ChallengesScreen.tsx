import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { spacing, radius, typography, touchTargetMin } from '../theme';
import { AppCard } from '../components/ui/AppCard';
import { EmptyState } from '../components/ui/EmptyState';
import { AppScreen } from '../components/ui/AppScreen';
import { getChallenges, getLeaderboardSeed, getSocialProgress, saveSocialProgress, type SocialChallenge } from '../storage/socialChallenges';

function iconForChallenge(icon: SocialChallenge['icon']) {
  if (icon === 'water') return 'water-outline';
  if (icon === 'flame') return 'flame-outline';
  return 'barbell-outline';
}

export function ChallengesScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [challenges, setChallenges] = useState<SocialChallenge[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; score: number }>>([]);

  const load = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [items, progress, board] = await Promise.all([
        getChallenges(),
        getSocialProgress(),
        getLeaderboardSeed((user?.email || 'Voce').split('@')[0]),
      ]);
      setChallenges(items);
      const p: Record<string, number> = {};
      for (const it of progress) p[it.challengeId] = it.value;
      setProgressMap(p);
      setLeaderboard(board);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const increment = async (challenge: SocialChallenge) => {
    const current = progressMap[challenge.id] ?? 0;
    const next = Math.min(challenge.target, current + 1);
    setProgressMap((prev) => ({ ...prev, [challenge.id]: next }));
    await saveSocialProgress({ challengeId: challenge.id, value: next, updatedAt: new Date().toISOString() });
  };

  return (
    <AppScreen
      style={styles.container}
      scrollable
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => load(true)}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <AppCard style={styles.heroCard}>
        <Text style={styles.kicker}>SOCIAL</Text>
        <Text style={styles.heroTitle}>Desafios e ranking</Text>
        <Text style={styles.heroSubtitle}>Acompanhe consistencia com sua turma e mantenha accountability semanal.</Text>
      </AppCard>

      <Text style={styles.sectionTitle}>Desafios ativos</Text>
      {loading && challenges.length === 0 ? (
        <AppCard><Text style={styles.muted}>Carregando desafios...</Text></AppCard>
      ) : challenges.length === 0 ? (
        <AppCard>
          <EmptyState
            iconName="trophy-outline"
            title="Desafios em breve!"
            subtitle="Seu profissional poderá criar desafios para você."
          />
        </AppCard>
      ) : (
        challenges.map((ch) => {
          const value = progressMap[ch.id] ?? 0;
          const pct = Math.min(100, Math.round((value / ch.target) * 100));
          return (
            <AppCard key={ch.id} style={styles.challengeCard}>
              <View style={styles.challengeHead}>
                <View style={styles.challengeIconWrap}>
                  <Ionicons name={iconForChallenge(ch.icon)} size={18} color={colors.primary} />
                </View>
                <View style={styles.challengeTextWrap}>
                  <Text style={styles.challengeTitle}>{ch.title}</Text>
                  <Text style={styles.challengeDesc}>{ch.description}</Text>
                </View>
              </View>
              <View style={styles.progressWrap}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${pct}%` }]} />
                </View>
                <Text style={styles.progressLabel}>{value}/{ch.target}</Text>
              </View>
              <TouchableOpacity style={styles.cta} onPress={() => increment(ch)}>
                <Text style={styles.ctaText}>Registrar progresso</Text>
              </TouchableOpacity>
            </AppCard>
          );
        })
      )}

      <Text style={styles.sectionTitle}>Leaderboard (consistencia)</Text>
      <AppCard>
        {leaderboard.map((entry, idx) => (
          <View key={`${entry.name}-${idx}`} style={[styles.rankRow, idx === leaderboard.length - 1 && styles.rankRowLast]}>
            <View style={styles.rankLeft}>
              <Text style={styles.rankPos}>#{idx + 1}</Text>
              <Text style={styles.rankName}>{entry.name}</Text>
            </View>
            <Text style={styles.rankScore}>{entry.score} pts</Text>
          </View>
        ))}
      </AppCard>

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
    sectionTitle: { ...typography.sectionTitle, color: colors.textSecondary, marginBottom: spacing.md, marginTop: spacing.md },
    muted: { color: colors.textMuted },
    challengeCard: { marginBottom: spacing.md },
    challengeHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    challengeIconWrap: {
      width: 34,
      height: 34,
      borderRadius: radius.full,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    challengeTextWrap: { flex: 1 },
    challengeTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
    challengeDesc: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    progressWrap: { marginTop: spacing.md },
    progressBarBg: { height: 8, backgroundColor: colors.surfaceElevated, borderRadius: 4, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
    progressLabel: { marginTop: spacing.xs, fontSize: 12, color: colors.textMuted },
    cta: {
      marginTop: spacing.md,
      minHeight: touchTargetMin,
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ctaText: { color: '#fff', fontSize: 14, fontWeight: '600' },
    rankRow: {
      minHeight: touchTargetMin,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: spacing.sm,
    },
    rankRowLast: { borderBottomWidth: 0 },
    rankLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    rankPos: { width: 28, fontSize: 14, fontWeight: '700', color: colors.textMuted },
    rankName: { fontSize: 15, color: colors.text },
    rankScore: { fontSize: 14, fontWeight: '700', color: colors.primary },
    bottom: { height: spacing.xl },
  });
}
