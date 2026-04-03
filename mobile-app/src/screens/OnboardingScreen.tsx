import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { spacing, radius, typography, touchTargetMin } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { AppScreen } from '../components/ui/AppScreen';
import { AppCard } from '../components/ui/AppCard';
import { Button } from '../components/ui/Button';

const ONBOARDING_DONE_KEY = '@patient_app_onboarding_done';

const SLIDES = [
  {
    icon: 'barbell' as const,
    title: 'Seu treino no celular',
    body: 'Acesse os planos enviados pelo seu personal, registre as séries e acompanhe sua evolução.',
  },
  {
    icon: 'nutrition' as const,
    title: 'Dieta e metas',
    body: 'Consulte as metas diárias, registre refeições e água. Tudo em um só lugar.',
  },
  {
    icon: 'trending-up' as const,
    title: 'Acompanhe sua evolução',
    body: 'Gráficos de peso, fotos de progresso e conquistas para manter a motivação.',
  },
];

export function OnboardingScreen({ onFinish }: { onFinish: () => void }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const isLast = index === SLIDES.length - 1;

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARDING_DONE_KEY, '1');
    onFinish();
  };

  const next = () => {
    if (isLast) finish();
    else setIndex((i) => i + 1);
  };

  const previous = () => {
    if (index === 0) return;
    setIndex((i) => i - 1);
  };

  return (
    <AppScreen style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.skip}
          onPress={finish}
          accessibilityLabel="Pular"
        >
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>

        <AppCard style={styles.slide}>
          <View style={styles.progressRow}>
            <Text style={styles.progressText}>{index + 1} de {SLIDES.length}</Text>
            <Text style={styles.progressHint}>{isLast ? 'Pronto para começar' : 'Leva menos de 1 minuto'}</Text>
          </View>
          <View style={styles.iconWrap}>
            <Ionicons name={slide.icon} size={64} color={colors.primary} />
          </View>
          <Text style={styles.kicker}>BEM-VINDO</Text>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.body}>{slide.body}</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>Seu profissional acompanha sua aderência e evolução.</Text>
            </View>
            <View style={styles.bulletRow}>
              <View style={styles.bulletDot} />
              <Text style={styles.bulletText}>Você registra o essencial em poucos toques.</Text>
            </View>
          </View>
        </AppCard>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.secondaryButton, index === 0 && styles.secondaryButtonHidden]}
            onPress={previous}
            activeOpacity={0.85}
            accessibilityLabel="Voltar"
            disabled={index === 0}
          >
            <Text style={styles.secondaryButtonText}>Voltar</Text>
          </TouchableOpacity>
          <Button
            title={isLast ? 'Ir para meu painel' : 'Continuar'}
            onPress={next}
            style={styles.primaryButton}
            accessibilityLabel={isLast ? 'Ir para meu painel' : 'Continuar onboarding'}
          />
        </View>
      </View>
    </AppScreen>
  );
}

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(ONBOARDING_DONE_KEY)) === '1';
  } catch {
    return false;
  }
}

export async function resetOnboarding(): Promise<void> {
  try {
    await AsyncStorage.removeItem(ONBOARDING_DONE_KEY);
  } catch {}
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: {
      flex: 1,
      paddingHorizontal: spacing.xl,
      justifyContent: 'space-between',
      paddingBottom: spacing.xxl,
    },
    skip: { alignSelf: 'flex-end', padding: spacing.md },
    skipText: { fontSize: 16, color: colors.textMuted },
    slide: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
    progressRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg },
    progressText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
    progressHint: { fontSize: 12, color: colors.textMuted },
    kicker: { fontSize: 11, letterSpacing: 1, fontWeight: '700', color: colors.primary, marginBottom: spacing.xs },
    iconWrap: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    title: { ...typography.title, color: colors.text, textAlign: 'center', marginBottom: spacing.md },
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.textSecondary,
      textAlign: 'center',
      maxWidth: 320,
    },
    bulletList: { width: '100%', marginTop: spacing.xl, gap: spacing.sm },
    bulletRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    bulletDot: {
      width: 8,
      height: 8,
      borderRadius: radius.full,
      backgroundColor: colors.primary,
      marginTop: 6,
    },
    bulletText: { flex: 1, fontSize: 14, lineHeight: 20, color: colors.textSecondary },
    dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
    dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.border },
    dotActive: { backgroundColor: colors.primary, width: 24 },
    actions: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
    primaryButton: { flex: 1 },
    secondaryButton: {
      minHeight: touchTargetMin,
      borderRadius: radius.md,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    secondaryButtonHidden: { opacity: 0 },
    secondaryButtonText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
    button: {
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.lg,
      alignItems: 'center',
      minHeight: 52,
      justifyContent: 'center',
    },
    buttonText: { fontSize: 17, fontWeight: '600', color: '#fff' },
  });
}
