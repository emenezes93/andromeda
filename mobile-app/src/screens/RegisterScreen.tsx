import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { resetOnboarding } from './OnboardingScreen';
import Ionicons from '@expo/vector-icons/Ionicons';
import { AppCard } from '../components/ui/AppCard';
import { AppInput } from '../components/ui/AppInput';
import { AppScreen } from '../components/ui/AppScreen';
import { Button } from '../components/ui/Button';
import { spacing, radius, typography } from '../theme';

export function RegisterScreen({
  route,
  navigation,
}: {
  route?: { params?: { tenantId?: string; email?: string; tenantName?: string } };
  navigation: { navigate: (name: string) => void; goBack: () => void };
}) {
  const { register } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const initialTenantId = route?.params?.tenantId ?? '';
  const initialEmail = route?.params?.email ?? '';
  const [tenantId, setTenantId] = useState(initialTenantId);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const invitedTenantName = route?.params?.tenantName?.trim();
  const invitedByLink = Boolean(initialTenantId || initialEmail);
  const emailLocked = Boolean(initialEmail);

  useEffect(() => {
    if (route?.params?.tenantId) setTenantId(route.params.tenantId);
    if (route?.params?.email) setEmail(route.params.email);
  }, [route?.params?.tenantId, route?.params?.email]);

  const handleRegister = async () => {
    const tid = tenantId.trim();
    const name = fullName.trim();
    const em = email.trim();
    const pw = password;
    if (!tid) {
      Alert.alert('Atenção', 'Informe o código da organização (fornecido pelo seu treinador).');
      return;
    }
    if (!name) {
      Alert.alert('Atenção', 'Informe seu nome completo.');
      return;
    }
    if (!em || !pw) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    if (!acceptTerms) {
      Alert.alert('Atenção', 'É necessário aceitar os termos de uso para criar a conta.');
      return;
    }
    setLoading(true);
    try {
      await resetOnboarding();
      await register(tid, name, em, pw);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Não foi possível criar a conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppCard style={styles.card}>
            <Text style={styles.kicker}>NOVA CONTA</Text>
            <Text style={styles.title}>Crie seu acesso.</Text>
            <Text style={styles.subtitle}>
              Seu plano fica pronto no celular assim que a conta for criada. Leva menos de 2 minutos.
            </Text>
            <View style={styles.stepsCard}>
              <Text style={styles.stepsTitle}>Como funciona</Text>
              <Text style={styles.stepsItem}>1. Informe o codigo da organizacao enviado pelo profissional.</Text>
              <Text style={styles.stepsItem}>2. Crie seu acesso com nome, e-mail e senha.</Text>
              <Text style={styles.stepsItem}>3. Entre e siga o onboarding para abrir seu painel.</Text>
            </View>
            {invitedByLink && (
              <View style={styles.inviteCallout}>
                <Ionicons name="mail-open-outline" size={16} color={colors.primary} />
                <Text style={styles.inviteText}>
                  Seu profissional {invitedTenantName || tenantId} ja deixou seu convite pronto.
                </Text>
              </View>
            )}

            <AppInput
              label="Código da organização"
              placeholder="Ex: academia123"
              value={tenantId}
              onChangeText={setTenantId}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !Boolean(initialTenantId)}
              accessibilityLabel="Código da organização"
              hint="Use exatamente o codigo compartilhado com voce."
            />

            <AppInput
              label="Nome completo"
              placeholder="Seu nome"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              editable={!loading}
              accessibilityLabel="Nome completo"
              hint="Esse nome aparece para o profissional acompanhar sua evolucao."
            />

            <AppInput
              label="E-mail"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading && !emailLocked}
              accessibilityLabel="E-mail"
              hint="Use o e-mail que voce pretende usar para entrar no app."
            />

            <AppInput
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              accessibilityLabel="Senha"
              hint="Prefira uma senha facil de lembrar e dificil de adivinhar."
            />

            <TouchableOpacity
              style={styles.termsRow}
              onPress={() => setAcceptTerms((a) => !a)}
              disabled={loading}
              activeOpacity={0.7}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: acceptTerms }}
            >
              <View style={[styles.checkbox, acceptTerms && styles.checkboxChecked]}>
                {acceptTerms && <Ionicons name="checkmark" size={14} color={colors.semantic.text.onPrimary} />}
              </View>
              <Text style={styles.termsText}>Li e aceito os termos de uso e a política de privacidade.</Text>
            </TouchableOpacity>

            <Button
              title="Criar conta"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              variant="primary"
              style={styles.button}
              accessibilityLabel="Criar conta"
            />

            <TouchableOpacity
              style={styles.backLink}
              onPress={() => navigation.goBack()}
              disabled={loading}
              accessibilityLabel="Voltar ao login"
            >
              <Text style={styles.backLinkText}>Já tem conta? Entrar</Text>
            </TouchableOpacity>
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: {
      flexGrow: 1,
      padding: spacing.xl,
      paddingVertical: spacing.xxl,
    },
    card: {},
    title: { ...typography.titleSmall, color: colors.text, textAlign: 'center' },
    kicker: {
      fontSize: 11,
      letterSpacing: 1.1,
      fontWeight: '700',
      color: colors.primary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    stepsCard: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.lg,
      gap: spacing.xs,
    },
    stepsTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    stepsItem: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    termsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    inviteCallout: {
      marginBottom: spacing.lg,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: radius.md,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    inviteText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    checkbox: {
      width: 22,
      height: 22,
      borderRadius: radius.sm,
      borderWidth: 2,
      borderColor: colors.borderLight,
      marginRight: spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    termsText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    button: { marginTop: spacing.sm },
    backLink: { marginTop: spacing.lg, alignItems: 'center' },
    backLinkText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
  });
}
