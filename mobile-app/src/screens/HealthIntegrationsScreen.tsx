import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, typography } from '../theme';
import { AppCard } from '../components/ui/AppCard';
import { AppScreen } from '../components/ui/AppScreen';

export function HealthIntegrationsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <AppScreen style={styles.container} scrollable contentContainerStyle={styles.content}>
      <AppCard style={styles.heroCard}>
        <Text style={styles.kicker}>INTEGRAÇÕES</Text>
        <Text style={styles.heroTitle}>Apple Health e Google Fit</Text>
        <Text style={styles.heroSubtitle}>Integração com Apple Health e Google Fit estará disponível em breve.</Text>
      </AppCard>

      <AppCard style={styles.placeholderCard}>
        <View style={styles.iconWrap}>
          <Ionicons name="pulse-outline" size={40} color={colors.primary} />
        </View>
        <Text style={styles.placeholderTitle}>Em breve no app</Text>
        <Text style={styles.placeholderText}>
          Em uma próxima atualização você poderá conectar suas integrações de saúde para sincronizar métricas automaticamente.
        </Text>
      </AppCard>
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
    placeholderCard: {
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },
    iconWrap: {
      width: 74,
      height: 74,
      borderRadius: radius.full,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    placeholderTitle: { ...typography.sectionTitle, color: colors.text, marginBottom: spacing.xs },
    placeholderText: { fontSize: 14, color: colors.textMuted, lineHeight: 21, textAlign: 'center' },
  });
}
