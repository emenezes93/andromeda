import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { getMe } from '../api/auth';
import type { MeResponse } from '../types';
import Ionicons from '@expo/vector-icons/Ionicons';
import { spacing, radius, typography, touchTargetMin } from '../theme';
import { AppScreen } from '../components/ui/AppScreen';
import { AppCard } from '../components/ui/AppCard';
import { Button } from '../components/ui/Button';
import { AnimatedEntrance } from '../components/ui/AnimatedEntrance';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const APPEARANCE_MODES: Array<{ key: 'system' | 'light' | 'dark'; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }> = [
  { key: 'system', label: 'Sistema', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Claro', icon: 'sunny-outline' },
  { key: 'dark', label: 'Escuro', icon: 'moon-outline' },
];

export function ProfileScreen() {
  const { user, token, tenantId, logout } = useAuth();
  const navigation = useNavigation();
  const { colors, themePreference, setThemePreference } = useTheme();
  const layout = useResponsiveLayout();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingTheme, setSavingTheme] = useState(false);
  const styles = useMemo(() => createStyles(colors, layout), [colors, layout]);

  useEffect(() => {
    if (!token || !tenantId) {
      setLoading(false);
      return;
    }
    getMe(token, tenantId)
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, [token, tenantId]);

  const handleThemeChange = async (mode: 'system' | 'light' | 'dark') => {
    setSavingTheme(true);
    try {
      await setThemePreference(mode);
    } finally {
      setSavingTheme(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const displayName = me?.patient?.fullName || user?.email || 'Paciente';
  const email = me?.patient?.email || user?.email || '—';
  const sessions = me?.sessionsCount ?? 0;
  const evolutions = me?.evolutionsCount ?? 0;
  const goals = me?.goalsCount ?? 0;

  return (
    <AppScreen style={styles.container} scrollable contentContainerStyle={styles.content}>
      <AnimatedEntrance>
        <AppCard style={styles.profileHero}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={30} color={colors.primary} />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.kicker}>MINHA CONTA</Text>
            <Text style={styles.heroName}>{displayName}</Text>
            <Text style={styles.heroMail}>{email}</Text>
          </View>
        </AppCard>
      </AnimatedEntrance>

      <AnimatedEntrance delay={40}>
        <View style={styles.statsRow}>
          <AppCard style={styles.statCard}>
            <Text style={styles.statValue}>{sessions}</Text>
            <Text style={styles.statLabel}>Sessões</Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <Text style={styles.statValue}>{evolutions}</Text>
            <Text style={styles.statLabel}>Evoluções</Text>
          </AppCard>
          <AppCard style={styles.statCard}>
            <Text style={styles.statValue}>{goals}</Text>
            <Text style={styles.statLabel}>Metas</Text>
          </AppCard>
        </View>
      </AnimatedEntrance>

      <AnimatedEntrance delay={80}>
        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Aparência</Text>
          <Text style={styles.hint}>Escolha como o app define o modo claro/escuro.</Text>
          <View style={styles.modeGrid}>
            {APPEARANCE_MODES.map((mode) => {
              const active = themePreference === mode.key;
              return (
                <TouchableOpacity
                  key={mode.key}
                  style={[styles.modeButton, active && styles.modeButtonActive]}
                  onPress={() => handleThemeChange(mode.key)}
                  disabled={savingTheme}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel={`Selecionar tema ${mode.label}`}
                >
                  <Ionicons
                    name={mode.icon}
                    size={18}
                    color={active ? colors.primary : colors.textMuted}
                  />
                  <Text style={[styles.modeButtonText, active && styles.modeButtonTextActive]}>
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </AppCard>
      </AnimatedEntrance>

      <AnimatedEntrance delay={120}>
        <AppCard style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Ecossistema</Text>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => (navigation as { navigate: (screen: string) => void }).navigate('Challenges')}
            activeOpacity={0.8}
          >
            <Ionicons name="podium-outline" size={18} color={colors.primary} />
            <Text style={styles.linkLabel}>Desafios e ranking</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => (navigation as { navigate: (screen: string) => void }).navigate('HealthIntegrations')}
            activeOpacity={0.8}
          >
            <Ionicons name="pulse-outline" size={18} color={colors.primary} />
            <Text style={styles.linkLabel}>Integrações Health</Text>
          </TouchableOpacity>
        </AppCard>
      </AnimatedEntrance>

      <AnimatedEntrance delay={160}>
        <Button
          title="Sair da conta"
          variant="danger"
          onPress={logout}
          accessibilityLabel="Sair da conta"
        />
      </AnimatedEntrance>
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
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    profileHero: {
      marginBottom: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    avatar: {
      width: 58,
      height: 58,
      borderRadius: radius.full,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroTextWrap: { flex: 1 },
    kicker: {
      fontSize: 11,
      letterSpacing: 1,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 2,
    },
    heroName: { ...typography.titleSmall, fontSize: layout.titleSize + 2, color: colors.text },
    heroMail: { ...typography.bodySmall, fontSize: layout.bodySize, color: colors.textMuted, marginTop: 2 },
    statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: spacing.lg },
    statValue: { fontSize: 24, fontWeight: '700', color: colors.primary },
    statLabel: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs },
    sectionCard: { marginBottom: spacing.lg },
    sectionTitle: { ...typography.sectionTitle, color: colors.textSecondary, marginBottom: spacing.xs },
    hint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 18 },
    modeGrid: { flexDirection: 'row', gap: spacing.sm },
    modeButton: {
      flex: 1,
      minHeight: touchTargetMin,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
    },
    modeButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primaryLight,
    },
    modeButtonText: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
    modeButtonTextActive: { color: colors.primary },
    linkRow: {
      minHeight: touchTargetMin,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingVertical: spacing.sm,
    },
    linkLabel: { fontSize: 14, color: colors.text },
  });
}
