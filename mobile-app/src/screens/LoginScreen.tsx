import React, { useMemo, useState } from 'react';
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
import { Button } from '../components/ui/Button';
import { AppCard } from '../components/ui/AppCard';
import { AppInput } from '../components/ui/AppInput';
import { AppScreen } from '../components/ui/AppScreen';
import { spacing, radius, typography } from '../theme';

export function LoginScreen({
  navigation,
}: {
  navigation: { navigate: (name: string) => void };
}) {
  const { login } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tenantId, setTenantId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const tid = tenantId.trim();
    const em = email.trim();
    const pw = password;
    if (!tid) {
      Alert.alert('Atenção', 'Informe o código da organização (fornecido pelo seu treinador).');
      return;
    }
    if (!em || !pw) {
      Alert.alert('Atenção', 'Preencha e-mail e senha.');
      return;
    }
    setLoading(true);
    try {
      await login(em, pw, tid);
    } catch (e) {
      Alert.alert('Erro', e instanceof Error ? e.message : 'Falha ao entrar. Tente novamente.');
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
          <View style={styles.header}>
            <Text style={styles.kicker}>FIT INSIGHT</Text>
            <Text style={styles.logo}>Seu plano do dia, sem friccao.</Text>
            <Text style={styles.subtitle}>Entre para acompanhar treino, dieta e progresso no mesmo lugar.</Text>
          </View>
          <AppCard style={styles.card}>
            <View style={styles.valueWrap}>
              <Text style={styles.hintTop}>
                Use o codigo da sua organizacao e suas credenciais para abrir o painel que seu profissional preparou.
              </Text>
              <View style={styles.benefitsList}>
                <Text style={styles.benefitItem}>Veja exatamente o que fazer hoje.</Text>
                <Text style={styles.benefitItem}>Registre agua, refeicoes e sessoes em poucos toques.</Text>
                <Text style={styles.benefitItem}>Mantenha seu acompanhamento sempre atualizado.</Text>
              </View>
            </View>

            <AppInput
              label="Código da organização"
              placeholder="Ex: academia123"
              value={tenantId}
              onChangeText={setTenantId}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              accessibilityLabel="Código da organização"
              hint="O codigo e enviado pelo seu personal, coach ou nutricionista."
            />

            <AppInput
              label="E-mail"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
              accessibilityLabel="E-mail"
            />

            <AppInput
              label="Senha"
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
              accessibilityLabel="Senha"
              hint="Se voce recebeu convite, use o mesmo e-mail informado ao profissional."
            />

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() =>
                Alert.alert(
                  'Recuperar senha',
                  'Entre em contato com seu profissional (personal ou nutricionista) para redefinir sua senha.'
                )
              }
              accessibilityLabel="Esqueci minha senha"
            >
              <Text style={styles.forgotLinkText}>Esqueci minha senha</Text>
            </TouchableOpacity>

            <Button
              title="Entrar"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              variant="primary"
              style={styles.button}
              accessibilityLabel="Entrar na conta"
            />

            <TouchableOpacity
              style={styles.registerLink}
              onPress={() => navigation.navigate('Register')}
              disabled={loading}
              accessibilityLabel="Criar conta"
            >
              <Text style={styles.registerLinkText}>Não tem conta? Criar conta</Text>
            </TouchableOpacity>

            <Text style={styles.footerHint}>
              Problema para entrar? Confira o codigo da organizacao e confirme se o convite foi feito para este e-mail.
            </Text>
          </AppCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: spacing.xl,
      paddingVertical: spacing.xxl,
    },
    header: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    logo: {
      ...typography.title,
      fontSize: 36,
      fontWeight: '700',
      color: colors.text,
      textAlign: 'center',
    },
    kicker: {
      fontSize: 12,
      letterSpacing: 1.2,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: 15,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.sm,
      lineHeight: 22,
    },
    card: {},
    valueWrap: { marginBottom: spacing.lg },
    hintTop: {
      fontSize: 14,
      color: colors.textMuted,
      textAlign: 'center',
      marginBottom: spacing.lg,
      lineHeight: 20,
    },
    benefitsList: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    benefitItem: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.sm },
    forgotLinkText: { fontSize: 14, color: colors.primary },
    button: { marginTop: spacing.md },
    registerLink: { marginTop: spacing.lg, alignItems: 'center' },
    registerLinkText: { fontSize: 15, color: colors.primary, fontWeight: '600' },
    footerHint: {
      fontSize: 12,
      color: colors.textSubtle,
      textAlign: 'center',
      marginTop: spacing.lg,
      lineHeight: 18,
    },
  });
}
