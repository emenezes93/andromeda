import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, RefreshControl, Alert } from 'react-native';
import { getWeightLogs, saveWeightEntry } from '../storage/weightLogs';
import type { WeightEntry } from '../types';
import { spacing, radius, typography, inputHeight } from '../theme';
import { Button } from '../components/ui/Button';
import { EvolutionChart, type EvolutionChartPeriod } from '../components/EvolutionChart';
import { AppCard } from '../components/ui/AppCard';
import { AppScreen } from '../components/ui/AppScreen';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonBlock } from '../components/ui/SkeletonBlock';
import { AnimatedEntrance } from '../components/ui/AnimatedEntrance';
import { useTheme } from '../context/ThemeContext';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function WeightLogScreen() {
  const { colors } = useTheme();
  const layout = useResponsiveLayout();
  const styles = useMemo(() => createStyles(colors, layout), [colors, layout]);
  const [logs, setLogs] = useState<WeightEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<EvolutionChartPeriod>(90);
  const [initialLoading, setInitialLoading] = useState(true);

  const load = async (withInitialLoader = false) => {
    if (withInitialLoader) setInitialLoading(true);
    try {
      const list = await getWeightLogs();
      setLogs(list);
    } finally {
      if (withInitialLoader) setInitialLoading(false);
    }
  };

  useEffect(() => {
    load(true);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const chartData = useMemo(() => logs.map((e) => ({ date: e.date, value: e.valueKg })).sort((a, b) => a.date.localeCompare(b.date)), [logs]);
  const chartMilestones = useMemo(() => {
    if (chartData.length < 2) return undefined;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - chartPeriod);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const inPeriod = chartData.filter((p) => p.date >= cutoffStr);
    if (inPeriod.length === 0) return undefined;
    const minVal = Math.min(...inPeriod.map((p) => p.value));
    const maxVal = Math.max(...inPeriod.map((p) => p.value));
    const first = inPeriod[0].value;
    const last = inPeriod[inPeriod.length - 1].value;
    const diff = Math.round((last - first) * 10) / 10;
    const diffLabel = diff < 0 ? `Perda total: ${Math.abs(diff)} kg` : diff > 0 ? `Ganho total: ${diff} kg` : null;
    return {
      min: `Mínimo: ${minVal} kg`,
      max: `Máximo: ${maxVal} kg`,
      diff: diffLabel ?? undefined,
    };
  }, [chartData, chartPeriod]);

  const handleSave = async () => {
    const v = value.trim().replace(',', '.');
    const num = parseFloat(v);
    if (!v || isNaN(num) || num <= 0 || num > 300) {
      Alert.alert('Atenção', 'Informe um peso válido (ex: 75 ou 75,5).');
      return;
    }
    setSaving(true);
    try {
      const entry: WeightEntry = {
        id: 'w-' + Date.now(),
        date: date.slice(0, 10),
        valueKg: num,
      };
      setLogs((prev) => [entry, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
      setValue('');
      setDate(todayISO());
      await saveWeightEntry(entry);
      await load();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o peso agora. Tente novamente.');
      await load();
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppScreen
      style={styles.container}
      scrollable
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <AnimatedEntrance>
        <AppCard style={styles.heroCard}>
        <Text style={styles.heroTitle}>Registro de peso</Text>
        <Text style={styles.heroSubtitle}>
          Registre com frequência para acompanhar tendência real e evitar variações pontuais.
        </Text>
        <Button
          title="Salvar peso"
          onPress={handleSave}
          loading={saving}
          disabled={saving || value.trim().length === 0}
          variant="primary"
          accessibilityLabel="Salvar peso"
        />
        </AppCard>
      </AnimatedEntrance>

      <AnimatedEntrance delay={40}>
        <View style={styles.chartSection}>
        <Text style={styles.sectionTitle}>Evolução do peso</Text>
        {initialLoading ? (
          <AppCard style={styles.chartSkeletonCard}>
            <SkeletonBlock style={styles.skeletonTitle} />
            <SkeletonBlock style={styles.skeletonChart} />
            <View style={styles.skeletonChipRow}>
              <SkeletonBlock style={styles.skeletonChip} />
              <SkeletonBlock style={styles.skeletonChip} />
              <SkeletonBlock style={styles.skeletonChip} />
            </View>
          </AppCard>
        ) : (
          <EvolutionChart
            data={chartData}
            period={chartPeriod}
            onPeriodChange={setChartPeriod}
            showMovingAverage
            movingAverageDays={7}
            yAxisSuffix=" kg"
            milestones={chartMilestones}
          />
        )}
        </View>
      </AnimatedEntrance>
      <AnimatedEntrance delay={80}>
        <AppCard style={styles.formCard}>
        <Text style={styles.sectionTitle}>Registrar peso</Text>
        <Text style={styles.label}>Data</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSubtle}
        />
        <Text style={styles.label}>Peso (kg)</Text>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder="Ex: 75,5"
          placeholderTextColor={colors.textSubtle}
          keyboardType="decimal-pad"
        />
        <Button
          title="Salvar"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          variant="primary"
          accessibilityLabel="Salvar peso"
        />
        </AppCard>
      </AnimatedEntrance>

      <AnimatedEntrance delay={120}>
        <Text style={styles.sectionTitle}>Histórico</Text>
      </AnimatedEntrance>
      <AnimatedEntrance delay={160}>
        <AppCard style={styles.historyCard}>
        {initialLoading ? (
          <View style={styles.skeletonList}>
            <SkeletonBlock style={styles.skeletonRow} />
            <SkeletonBlock style={styles.skeletonRow} />
            <SkeletonBlock style={styles.skeletonRow} />
          </View>
        ) : logs.length === 0 ? (
          <EmptyState
            iconName="scale-outline"
            title="Nenhum peso registrado"
            subtitle="Adicione seu primeiro registro para acompanhar sua evolução."
          />
        ) : (
          logs.map((entry, index) => (
            <AnimatedEntrance
              key={entry.id}
              delay={Math.min(40 * index, 240)}
            >
              <View style={[styles.row, index === logs.length - 1 && styles.rowLast]}>
                <Text style={styles.rowDate}>
                  {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </Text>
                <Text style={styles.rowValue}>{entry.valueKg} kg</Text>
              </View>
            </AnimatedEntrance>
          ))
        )}
        </AppCard>
      </AnimatedEntrance>

      <AnimatedEntrance delay={220}>
        <AppCard style={styles.healthPlaceholder}>
        <Text style={styles.healthPlaceholderText}>
          Integração com Apple Health e Google Fit em breve.
        </Text>
        </AppCard>
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
    content: { padding: layout.contentPadding, paddingBottom: spacing.listBottom },
    heroCard: { marginBottom: spacing.xl },
    heroTitle: { ...typography.titleSmall, fontSize: layout.titleSize + 2, color: colors.text, marginBottom: spacing.xs },
    heroSubtitle: { fontSize: layout.bodySize, color: colors.textMuted, lineHeight: layout.bodySize + 6, marginBottom: spacing.lg },
    chartSection: { marginBottom: spacing.xl },
    formCard: { marginBottom: spacing.xl },
    sectionTitle: { ...typography.sectionTitle, color: colors.textSecondary, marginBottom: spacing.md },
    label: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
    input: {
      backgroundColor: colors.background,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.md,
      height: inputHeight,
      fontSize: 16,
      color: colors.text,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyCard: { marginBottom: spacing.xl, paddingVertical: spacing.sm },
    chartSkeletonCard: { padding: spacing.lg },
    skeletonTitle: { height: 16, width: '45%', marginBottom: spacing.md },
    skeletonChart: { height: 170, width: '100%', marginBottom: spacing.md },
    skeletonChipRow: { flexDirection: 'row', gap: spacing.sm },
    skeletonChip: { height: 32, width: 56, borderRadius: radius.full },
    skeletonList: { paddingHorizontal: spacing.xl, paddingVertical: spacing.sm, gap: spacing.md },
    skeletonRow: { height: 22, width: '100%' },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    rowLast: { borderBottomWidth: 0 },
    rowDate: { fontSize: 15, color: colors.text },
    rowValue: { fontSize: 15, fontWeight: '600', color: colors.primary },
    healthPlaceholder: {
      marginTop: spacing.xs,
      backgroundColor: colors.surfaceElevated,
    },
    healthPlaceholderText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  });
}
