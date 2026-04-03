import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { getBodyMeasurements, saveBodyMeasurement, deleteBodyMeasurement } from '../storage/bodyMeasurements';
import type { BodyMeasurementEntry } from '../types';
import { spacing, radius, typography } from '../theme';
import { EvolutionChart } from '../components/EvolutionChart';
import { useTheme } from '../context/ThemeContext';
import { AppScreen } from '../components/ui/AppScreen';
import { AppCard } from '../components/ui/AppCard';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { SkeletonBlock } from '../components/ui/SkeletonBlock';
import { AnimatedEntrance } from '../components/ui/AnimatedEntrance';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const FIELDS: { key: keyof BodyMeasurementEntry; label: string }[] = [
  { key: 'waistCm', label: 'Cintura (cm)' },
  { key: 'hipCm', label: 'Quadril (cm)' },
  { key: 'chestCm', label: 'Peito (cm)' },
  { key: 'armLeftCm', label: 'Braço esq. (cm)' },
  { key: 'armRightCm', label: 'Braço dir. (cm)' },
  { key: 'thighLeftCm', label: 'Coxa esq. (cm)' },
  { key: 'thighRightCm', label: 'Coxa dir. (cm)' },
  { key: 'neckCm', label: 'Pescoço (cm)' },
];

export function BodyMeasurementsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [list, setList] = useState<BodyMeasurementEntry[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [date, setDate] = useState(todayISO());
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<30 | 60 | 90>(90);
  const [initialLoading, setInitialLoading] = useState(true);

  const chartDataByField = useMemo(() => {
    const out: Record<string, { date: string; value: number }[]> = {};
    for (const f of FIELDS) {
      if (f.key === 'id' || f.key === 'date') continue;
      const points = list
        .filter((e) => e[f.key] != null && (e[f.key] as number) > 0)
        .map((e) => ({ date: e.date, value: e[f.key] as number }))
        .sort((a, b) => a.date.localeCompare(b.date));
      if (points.length >= 2) out[f.key] = points;
    }
    return out;
  }, [list]);

  const load = async (withInitialLoader = false) => {
    if (withInitialLoader) setInitialLoading(true);
    try {
      const data = await getBodyMeasurements();
      setList(data);
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

  const setField = (key: string, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
  };

  const handleSave = async () => {
    const entry: BodyMeasurementEntry = {
      id: 'bm-' + Date.now(),
      date: date.slice(0, 10),
    };
    const optionalKeys: (keyof Omit<BodyMeasurementEntry, 'id' | 'date'>)[] = [
      'waistCm', 'hipCm', 'chestCm', 'armLeftCm', 'armRightCm', 'thighLeftCm', 'thighRightCm', 'neckCm',
    ];
    let hasAny = false;
    for (const key of optionalKeys) {
      const raw = values[key];
      if (raw != null && raw.trim() !== '') {
        const n = parseFloat(raw.replace(',', '.'));
        if (!isNaN(n) && n > 0) {
          entry[key] = n;
          hasAny = true;
        }
      }
    }
    if (!hasAny) {
      Alert.alert('Atenção', 'Informe pelo menos uma medida.');
      return;
    }
    setSaving(true);
    setList((prev) => [entry, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
    setValues({});
    setDate(todayISO());
    try {
      await saveBodyMeasurement(entry);
      await load();
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar a medição agora. Tente novamente.');
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Remover', 'Deseja remover este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          const previous = list;
          setList((prev) => prev.filter((entry) => entry.id !== id));
          try {
            await deleteBodyMeasurement(id);
            await load();
          } catch {
            setList(previous);
            Alert.alert('Erro', 'Não foi possível remover este registro agora.');
          }
        },
      },
    ]);
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
        <AppCard style={styles.formCard}>
        <Text style={styles.sectionTitle}>Nova medição</Text>
        <Text style={styles.label}>Data</Text>
        <TextInput
          style={styles.input}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textSubtle}
        />
        {FIELDS.filter((f) => f.key !== 'id' && f.key !== 'date').map(({ key, label }) => (
          <React.Fragment key={key}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              value={values[key] ?? ''}
              onChangeText={(t) => setField(key, t)}
              placeholder="Opcional"
              placeholderTextColor={colors.textSubtle}
              keyboardType="decimal-pad"
            />
          </React.Fragment>
        ))}
        <Button
          title="Salvar"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          accessibilityLabel="Salvar medição corporal"
        />
        </AppCard>
      </AnimatedEntrance>

      {initialLoading ? (
        <AnimatedEntrance delay={40}>
          <AppCard style={styles.chartSection}>
          <SkeletonBlock style={styles.skeletonChartTitle} />
          <SkeletonBlock style={styles.skeletonChart} />
          <SkeletonBlock style={styles.skeletonChart} />
          </AppCard>
        </AnimatedEntrance>
      ) : list.length >= 2 && Object.keys(chartDataByField).length > 0 ? (
        <AnimatedEntrance delay={40}>
          <View style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Evolução por medida</Text>
          <Text style={styles.chartHint}>Frequência sugerida: quinzenal ou mensal</Text>
          {FIELDS.filter((f) => chartDataByField[f.key]).map(({ key, label }) => (
            <AnimatedEntrance key={key} delay={90}>
              <View style={styles.chartBlock}>
              <Text style={styles.chartLabel}>{label}</Text>
              <EvolutionChart
                data={chartDataByField[key]}
                period={chartPeriod}
                onPeriodChange={setChartPeriod}
                yAxisSuffix=" cm"
              />
              </View>
            </AnimatedEntrance>
          ))}
          </View>
        </AnimatedEntrance>
      ) : null}

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
        ) : list.length === 0 ? (
          <EmptyState
            iconName="body-outline"
            title="Nenhuma medida registrada"
            subtitle="Adicione medidas para acompanhar sua evolução por regiões do corpo."
          />
        ) : (
          list.map((entry, index) => (
            <AnimatedEntrance key={entry.id} delay={Math.min(40 * index, 240)}>
              <View style={styles.card}>
              <Text style={styles.cardDate}>
                {new Date(entry.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </Text>
              <View style={styles.cardRow}>
                {(['waistCm', 'hipCm', 'chestCm', 'armLeftCm', 'armRightCm'] as const).map(
                  (k) =>
                    entry[k] != null ? (
                      <Text key={k} style={styles.cardValue}>{String(entry[k])} cm</Text>
                    ) : null
                )}
              </View>
              <TouchableOpacity onPress={() => handleDelete(entry.id)} style={styles.deleteBtn}>
                <Text style={styles.deleteText}>Remover</Text>
              </TouchableOpacity>
              </View>
            </AnimatedEntrance>
          ))
        )}
        </AppCard>
      </AnimatedEntrance>
    </AppScreen>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    formCard: { marginBottom: spacing.xl },
    sectionTitle: { ...typography.sectionTitle, color: colors.textSecondary, marginBottom: spacing.md },
    label: { ...typography.label, color: colors.textMuted, marginBottom: spacing.sm },
    input: {
      backgroundColor: colors.background,
      borderRadius: radius.sm,
      padding: spacing.md,
      fontSize: 16,
      color: colors.text,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    historyCard: { marginBottom: spacing.xl },
    card: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: radius.md,
      padding: spacing.lg,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    cardDate: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: spacing.sm },
    cardRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    cardValue: { fontSize: 14, color: colors.textMuted },
    deleteBtn: { marginTop: spacing.sm },
    deleteText: { fontSize: 14, color: colors.error },
    chartSection: { marginBottom: spacing.xl },
    chartHint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
    chartBlock: { marginBottom: spacing.xl },
    chartLabel: { ...typography.sectionTitle, color: colors.textSecondary, marginBottom: spacing.sm },
    skeletonList: { gap: spacing.md, paddingVertical: spacing.sm },
    skeletonRow: { height: 24, width: '100%' },
    skeletonChartTitle: { height: 16, width: '45%', marginBottom: spacing.md },
    skeletonChart: { height: 150, width: '100%', marginBottom: spacing.md },
  });
}
