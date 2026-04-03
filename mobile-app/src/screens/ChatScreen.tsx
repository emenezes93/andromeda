import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { AppScreen } from '../components/ui/AppScreen';
import { AppCard } from '../components/ui/AppCard';
import { Button } from '../components/ui/Button';

/** F6.1 — Atalho para abrir WhatsApp com texto pré-preenchido (sem depender da WhatsApp Business API). */
const DEFAULT_WHATSAPP_NUMBER = '5511999999999';
const WHATSAPP_PREFILL_TEXT = 'Olá! Estou entrando em contato pelo app de treino/dieta.';

export function ChatScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const openWhatsApp = () => {
    const phone = (process.env.EXPO_PUBLIC_COACH_WHATSAPP || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, '');
    const text = encodeURIComponent(WHATSAPP_PREFILL_TEXT);
    Linking.openURL(`https://wa.me/${phone}?text=${text}`).catch(() => {});
  };

  return (
    <AppScreen style={styles.container} scrollable contentContainerStyle={styles.content}>
      <AppCard style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <Ionicons name="chatbubbles-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.kicker}>SUPORTE DIRETO</Text>
        <Text style={styles.title}>Fale com seu profissional</Text>
        <Text style={styles.body}>
          Canal rápido para tirar dúvidas, alinhar ajustes e manter consistência no plano.
        </Text>
        <Button title="Abrir conversa no WhatsApp" onPress={openWhatsApp} />
      </AppCard>

      <AppCard style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Quando usar</Text>
        <View style={styles.tipRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.tipText}>Dúvidas sobre treino ou execução de exercício.</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.tipText}>Ajustes no plano alimentar e rotina da semana.</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="checkmark-circle-outline" size={16} color={colors.primary} />
          <Text style={styles.tipText}>Feedback sobre evolução, dores ou indisposição.</Text>
        </View>
      </AppCard>

      <TouchableOpacity style={styles.noteCard} onPress={openWhatsApp} activeOpacity={0.85}>
        <Ionicons name="logo-whatsapp" size={18} color={colors.primary} />
        <Text style={styles.note}>
          O app abre o WhatsApp com mensagem pronta para agilizar o contato.
        </Text>
      </TouchableOpacity>
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
    heroCard: { alignItems: 'center' },
    heroIconWrap: {
      width: 56,
      height: 56,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
      marginBottom: spacing.md,
    },
    kicker: {
      fontSize: 11,
      letterSpacing: 1,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    title: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.md, textAlign: 'center' },
    body: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 21,
      marginBottom: spacing.lg,
      textAlign: 'center',
    },
    tipsCard: { paddingVertical: spacing.lg },
    tipsTitle: {
      ...typography.sectionTitle,
      color: colors.text,
      marginBottom: spacing.md,
    },
    tipRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    tipText: { flex: 1, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    noteCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    note: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  });
}
