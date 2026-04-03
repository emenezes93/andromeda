import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { logWorkout } from '../api/training';
import Ionicons from '@expo/vector-icons/Ionicons';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';
import { AppScreen } from '../components/ui/AppScreen';
import { AppCard } from '../components/ui/AppCard';
import { Button } from '../components/ui/Button';

export function LogWorkoutScreen({
  route,
  navigation,
}: {
  route: { params: { planId: string; planName?: string } };
  navigation: { goBack: () => void };
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { token, tenantId } = useAuth();
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!token || !tenantId) return;
    setLoading(true);
    try {
      const executedAt = new Date().toISOString();
      await logWorkout(
        {
          trainingPlanId: route.params.planId,
          executedAt,
          durationMinutes: duration ? parseInt(duration, 10) : undefined,
          notes: notes.trim() || undefined,
          completed,
        },
        token,
        tenantId
      );
      Alert.alert('Sucesso', 'Treino registrado com sucesso!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert(
        'Erro',
        e instanceof Error ? e.message : 'Não foi possível registrar. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppScreen style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <AppCard style={styles.content}>
          {route.params.planName ? (
            <Text style={styles.subtitle}>Plano: {route.params.planName}</Text>
          ) : null}
          <Text style={styles.kicker}>REGISTRO MANUAL</Text>
          <Text style={styles.title}>Registrar treino realizado</Text>
          <Text style={styles.hint}>Preencha os campos abaixo. Data e hora são registradas automaticamente.</Text>

        <Text style={styles.label}>Duração (minutos)</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: 60"
          placeholderTextColor={colors.textSubtle}
          value={duration}
          onChangeText={setDuration}
          keyboardType="number-pad"
          editable={!loading}
        />

        <Text style={styles.label}>Observações</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Como foi o treino? Dores, carga, etc."
          placeholderTextColor={colors.textSubtle}
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          editable={!loading}
        />

        <TouchableOpacity
          style={styles.checkRow}
          onPress={() => setCompleted((c) => !c)}
          disabled={loading}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, completed && styles.checkboxChecked]}>
            {completed ? <Ionicons name="checkmark-circle" size={18} color="#fff" /> : null}
          </View>
          <Text style={styles.checkLabel}>Marcar como treino concluído</Text>
        </TouchableOpacity>

          <Button
            title="Registrar treino"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
          />

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
        </AppCard>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { margin: spacing.lg, marginTop: spacing.xl },
    subtitle: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: spacing.xs,
    },
    kicker: {
      fontSize: 11,
      letterSpacing: 1,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: spacing.xs,
    },
    title: {
      ...typography.titleSmall,
      color: colors.text,
      marginBottom: spacing.sm,
    },
    hint: {
      fontSize: 14,
      color: colors.textMuted,
      marginBottom: spacing.xl,
      lineHeight: 20,
    },
    label: {
      ...typography.label,
      color: colors.textSecondary,
      marginBottom: spacing.sm,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
      fontSize: 16,
      color: colors.text,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    textArea: {
      minHeight: 100,
      textAlignVertical: 'top',
    },
    checkRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.xl,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: radius.sm,
      borderWidth: 2,
      borderColor: colors.borderLight,
      marginRight: spacing.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    checkLabel: { fontSize: 16, color: colors.text },
    cancelButton: { alignItems: 'center', marginTop: spacing.lg },
    cancelText: { color: colors.textSubtle, fontSize: 16 },
  });
}
