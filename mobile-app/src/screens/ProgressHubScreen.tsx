import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { AppCard } from '../components/ui/AppCard';
import { AppListItem } from '../components/ui/AppListItem';
import { AppScreen } from '../components/ui/AppScreen';
import { AnimatedEntrance } from '../components/ui/AnimatedEntrance';
import { spacing, radius, typography } from '../theme';
import { Button } from '../components/ui/Button';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

const MENU_ITEMS: Array<{
  key: string;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  screen: string;
}> = [
  { key: 'weight', label: 'Peso corporal', icon: 'scale-outline', screen: 'WeightLog' },
  { key: 'photos', label: 'Fotos de progresso', icon: 'camera-outline', screen: 'ProgressPhotos' },
  { key: 'charts', label: 'Gráficos de evolução', icon: 'trending-up-outline', screen: 'EvolutionCharts' },
  { key: 'measurements', label: 'Medidas corporais', icon: 'body-outline', screen: 'BodyMeasurements' },
  { key: 'notifications', label: 'Notificações', icon: 'notifications-outline', screen: 'Notifications' },
  { key: 'achievements', label: 'Conquistas', icon: 'trophy-outline', screen: 'Achievements' },
  { key: 'challenges', label: 'Desafios e ranking', icon: 'podium-outline', screen: 'Challenges' },
  { key: 'health', label: 'Integrações Health', icon: 'pulse-outline', screen: 'HealthIntegrations' },
  { key: 'profile', label: 'Perfil e configurações', icon: 'person-outline', screen: 'Profile' },
];
const FOCUS_CARDS = [
  { key: 'weight', title: 'Peso', subtitle: 'Registro semanal', screen: 'WeightLog', icon: 'scale-outline' as const },
  { key: 'photos', title: 'Fotos', subtitle: 'Comparar evolucao', screen: 'ProgressPhotos', icon: 'camera-outline' as const },
  { key: 'measurements', title: 'Medidas', subtitle: 'Cintura, braco e mais', screen: 'BodyMeasurements', icon: 'body-outline' as const },
];

export function ProgressHubScreen({
  navigation,
}: {
  navigation: { navigate: (name: string) => void };
}) {
  const { colors } = useTheme();
  const layout = useResponsiveLayout();
  const styles = useMemo(() => createStyles(colors, layout), [colors, layout]);

  return (
    <AppScreen style={styles.container} scrollable contentContainerStyle={styles.content}>
      <View style={styles.sidebar}>
        <AnimatedEntrance>
          <Text style={styles.kicker}>PROGRESSO</Text>
          <Text style={styles.title}>Central de Progresso</Text>
        </AnimatedEntrance>
        <AnimatedEntrance delay={40}>
          <Text style={styles.subtitle}>Registre sinais de evolucao, acompanhe constancia e mantenha o profissional atualizado.</Text>
        </AnimatedEntrance>

        <AnimatedEntrance delay={70}>
          <AppCard style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Ionicons name="sparkles-outline" size={14} color={colors.primary} />
              <Text style={styles.heroBadgeText}>Foco semanal</Text>
            </View>
            <Text style={styles.heroTitle}>Atualize pelo menos um indicador nesta semana</Text>
            <Text style={styles.heroSubtitle}>Peso, fotos e medidas sao os sinais mais claros para mostrar resultado e ajustar seu plano.</Text>
            <Button
              title="Registrar peso agora"
              onPress={() => navigation.navigate('WeightLog')}
              accessibilityLabel="Registrar peso agora"
            />
          </AppCard>
        </AnimatedEntrance>

        <AnimatedEntrance delay={80}>
          <Text style={styles.sectionLabel}>Registros principais</Text>
          <View style={styles.focusGrid}>
            {FOCUS_CARDS.map((item, index) => (
              <AnimatedEntrance key={item.key} delay={Math.min(45 * index, 180)}>
                <TouchableOpacity
                  style={styles.focusCard}
                  onPress={() => navigation.navigate(item.screen)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={item.icon} size={20} color={colors.primary} style={styles.focusIcon} />
                  <Text style={styles.focusTitle}>{item.title}</Text>
                  <Text style={styles.focusSubtitle}>{item.subtitle}</Text>
                </TouchableOpacity>
              </AnimatedEntrance>
            ))}
          </View>
        </AnimatedEntrance>

        <AnimatedEntrance delay={100}>
          <AppCard style={styles.supportCard}>
            <Text style={styles.supportTitle}>Acompanhamento e configuracoes</Text>
            <Text style={styles.supportSubtitle}>
              Use esta area para revisar notificacoes, desafios, integracoes e preferencias da conta.
            </Text>
          </AppCard>
        </AnimatedEntrance>

        <AnimatedEntrance delay={120}>
          <AppCard style={styles.menu} padded={false}>
            {MENU_ITEMS.map((item, index) => (
              <AnimatedEntrance key={item.key} delay={Math.min(35 * index, 210)}>
                <AppListItem
                  label={item.label}
                  icon={item.icon}
                  onPress={() => navigation.navigate(item.screen)}
                  isLast={index === MENU_ITEMS.length - 1}
                />
              </AnimatedEntrance>
            ))}
          </AppCard>
        </AnimatedEntrance>
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
    content: { padding: layout.contentPadding, paddingBottom: spacing.listBottom },
    sidebar: {},
    kicker: {
      fontSize: 11,
      letterSpacing: 1,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    title: { ...typography.title, fontSize: layout.heroTitleSize, lineHeight: layout.heroTitleSize + 6, color: colors.text, marginBottom: spacing.xs },
    subtitle: { ...typography.bodySmall, fontSize: layout.bodySize, color: colors.textMuted, marginBottom: spacing.xl },
    heroCard: { marginBottom: spacing.lg },
    heroBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.primaryLight,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      marginBottom: spacing.md,
    },
    heroBadgeText: { fontSize: 11, fontWeight: '600', color: colors.primary },
    heroTitle: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.xs },
    heroSubtitle: { ...typography.bodySmall, color: colors.textMuted, marginBottom: spacing.lg },
    sectionLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    focusGrid: {
      flexDirection: layout.tier === 'compact' ? 'column' : 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    focusCard: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      minHeight: layout.tier === 'compact' ? 88 : 108,
      justifyContent: 'space-between',
    },
    focusIcon: {},
    focusTitle: { fontSize: layout.titleSize - 2, fontWeight: '700', color: colors.text, marginTop: spacing.xs },
    focusSubtitle: { fontSize: layout.captionSize, color: colors.textMuted, marginTop: spacing.xs, lineHeight: layout.captionSize + 4 },
    supportCard: { marginBottom: spacing.lg },
    supportTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.xs },
    supportSubtitle: { fontSize: layout.bodySize - 1, color: colors.textMuted, lineHeight: layout.bodySize + 5 },
    menu: {
      borderRadius: radius.md,
      overflow: 'hidden',
    },
  });
}
