import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { AppScreen } from '../components/ui/AppScreen';
import { AppCard } from '../components/ui/AppCard';
import { Button } from '../components/ui/Button';
import { spacing, radius, typography, inputHeight, touchTargetMin } from '../theme';
import {
  getFillQuestionnaire,
  submitFillQuestionnaire,
  type FillQuestionnaireResponse,
  type QuestionnaireAnswerValue,
  type QuestionnaireQuestion,
} from '../api/questionnaire';

type AnswersState = Record<string, QuestionnaireAnswerValue | ''>;

export function FillQuestionnaireScreen({
  route,
}: {
  route?: { params?: { fillToken?: string } };
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const fillToken = route?.params?.fillToken;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [questionnaire, setQuestionnaire] = useState<FillQuestionnaireResponse | null>(null);
  const [answers, setAnswers] = useState<AnswersState>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!fillToken) {
      setError('Token inválido para preenchimento.');
      setLoading(false);
      return;
    }
    getFillQuestionnaire(fillToken)
      .then((data) => {
        if (cancelled) return;
        setQuestionnaire(data);
        setAnswers(data.initialAnswers ?? {});
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Não foi possível carregar o questionário.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fillToken]);

  const setAnswer = (questionId: string, value: QuestionnaireAnswerValue | '') => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const toggleMultiOption = (questionId: string, option: string) => {
    const current = answers[questionId];
    const array = Array.isArray(current) ? current : [];
    const exists = array.includes(option);
    const next = exists ? array.filter((o) => o !== option) : [...array, option];
    setAnswer(questionId, next);
  };

  const handleSubmit = async () => {
    if (!questionnaire || !fillToken) return;
    setError(null);
    const payload = { answers: [] as Array<{ questionId: string; value: QuestionnaireAnswerValue }> };

    for (const question of questionnaire.questions) {
      const value = answers[question.id];
      const isEmptyArray = Array.isArray(value) && value.length === 0;
      const isBlankString = typeof value === 'string' && value.trim().length === 0;
      const isMissing = value === undefined || value === '' || isBlankString || isEmptyArray;

      if (question.required && isMissing) {
        setError(`Responda o campo obrigatório: ${question.label}`);
        return;
      }

      if (isMissing) continue;

      if (question.type === 'number') {
        const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
        if (!Number.isFinite(parsed)) {
          setError(`Informe um número válido em: ${question.label}`);
          return;
        }
        payload.answers.push({ questionId: question.id, value: parsed });
        continue;
      }

      payload.answers.push({ questionId: question.id, value: value as QuestionnaireAnswerValue });
    }

    setSaving(true);
    try {
      await submitFillQuestionnaire(fillToken, payload);
      setSubmitted(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível enviar as respostas.');
    } finally {
      setSaving(false);
    }
  };

  const renderQuestion = (question: QuestionnaireQuestion) => {
    const value = answers[question.id];

    if (question.type === 'text') {
      return (
        <TextInput
          style={styles.input}
          value={typeof value === 'string' ? value : ''}
          onChangeText={(t) => setAnswer(question.id, t)}
          placeholder="Digite sua resposta"
          placeholderTextColor={colors.textSubtle}
          multiline
        />
      );
    }

    if (question.type === 'number') {
      return (
        <TextInput
          style={styles.input}
          value={typeof value === 'number' ? String(value) : typeof value === 'string' ? value : ''}
          onChangeText={(t) => {
            const normalized = t.replace(',', '.').trim();
            if (!normalized) {
              setAnswer(question.id, '');
              return;
            }
            const parsed = Number(normalized);
            setAnswer(question.id, Number.isNaN(parsed) ? t : parsed);
          }}
          placeholder="Digite um número"
          placeholderTextColor={colors.textSubtle}
          keyboardType="numeric"
        />
      );
    }

    if (question.type === 'single') {
      return (
        <View style={styles.optionsWrap}>
          {(question.options ?? []).map((option) => {
            const selected = value === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, selected && styles.optionButtonActive]}
                onPress={() => setAnswer(question.id, option)}
              >
                <Text style={[styles.optionText, selected && styles.optionTextActive]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    if (question.type === 'multiple') {
      const selected = Array.isArray(value) ? value : [];
      return (
        <View style={styles.optionsWrap}>
          {(question.options ?? []).map((option) => {
            const checked = selected.includes(option);
            return (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, checked && styles.optionButtonActive]}
                onPress={() => toggleMultiOption(question.id, option)}
              >
                <Text style={[styles.optionText, checked && styles.optionTextActive]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    }

    // sentiment (0-10)
    return (
      <View>
        <View style={styles.sentimentScale}>
          {Array.from({ length: 11 }, (_, i) => i).map((n) => {
            const selected = value === n;
            return (
              <TouchableOpacity
                key={n}
                style={[styles.sentimentButton, selected && styles.sentimentButtonActive]}
                onPress={() => setAnswer(question.id, n)}
              >
                <Text style={[styles.sentimentText, selected && styles.sentimentTextActive]}>{n}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <View style={styles.sentimentLabels}>
          <Text style={styles.sentimentHint}>0 (baixo)</Text>
          <Text style={styles.sentimentHint}>10 (alto)</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <AppScreen style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  if (submitted) {
    return (
      <AppScreen style={styles.container} contentContainerStyle={styles.content}>
        <AppCard>
          <Text style={styles.successTitle}>Respostas enviadas com sucesso!</Text>
          <Text style={styles.successBody}>Seu profissional já pode visualizar seu preenchimento.</Text>
        </AppCard>
      </AppScreen>
    );
  }

  if (!questionnaire) {
    return (
      <AppScreen style={styles.container} contentContainerStyle={styles.content}>
        <AppCard>
          <Text style={styles.errorText}>{error || 'Questionário indisponível.'}</Text>
        </AppCard>
      </AppScreen>
    );
  }

  return (
    <AppScreen style={styles.container} scrollable contentContainerStyle={styles.content}>
      <AppCard style={styles.heroCard}>
        <Text style={styles.kicker}>ANAMNESE</Text>
        <Text style={styles.title}>{questionnaire.title}</Text>
        {questionnaire.description ? <Text style={styles.subtitle}>{questionnaire.description}</Text> : null}
      </AppCard>

      {questionnaire.questions.map((question) => (
        <AppCard key={question.id} style={styles.questionCard}>
          <Text style={styles.questionLabel}>{question.label}</Text>
          {question.description ? <Text style={styles.questionDescription}>{question.description}</Text> : null}
          {renderQuestion(question)}
        </AppCard>
      ))}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <Button
        title="Enviar respostas"
        onPress={handleSubmit}
        loading={saving}
        disabled={saving}
        accessibilityLabel="Enviar respostas"
      />
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    heroCard: { marginBottom: spacing.lg },
    kicker: { fontSize: 11, fontWeight: '700', letterSpacing: 1, color: colors.textSubtle, marginBottom: spacing.xs },
    title: { ...typography.titleSmall, color: colors.text },
    subtitle: { marginTop: spacing.xs, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
    questionCard: { marginBottom: spacing.md },
    questionLabel: { ...typography.sectionTitle, color: colors.textSecondary },
    questionDescription: { marginTop: spacing.xs, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
    input: {
      marginTop: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      borderRadius: radius.sm,
      minHeight: inputHeight,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.text,
      fontSize: 15,
    },
    optionsWrap: { marginTop: spacing.md, gap: spacing.sm },
    optionButton: {
      minHeight: touchTargetMin,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceElevated,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    optionButtonActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    optionText: { fontSize: 14, color: colors.textMuted },
    optionTextActive: { color: colors.primary, fontWeight: '600' },
    sentimentScale: { marginTop: spacing.md, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    sentimentButton: {
      width: 28,
      height: 28,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    sentimentButtonActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
    sentimentText: { fontSize: 12, color: colors.textMuted },
    sentimentTextActive: { color: colors.primary, fontWeight: '700' },
    sentimentLabels: { marginTop: spacing.xs, flexDirection: 'row', justifyContent: 'space-between' },
    sentimentHint: { fontSize: 11, color: colors.textSubtle },
    errorText: { marginTop: spacing.sm, fontSize: 13, color: colors.error },
    successTitle: { ...typography.titleSmall, color: colors.success, marginBottom: spacing.sm },
    successBody: { fontSize: 14, color: colors.textSecondary },
  });
}
