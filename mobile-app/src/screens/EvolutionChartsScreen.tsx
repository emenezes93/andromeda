import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { getWeightLogs } from '../storage/weightLogs';
import { getBodyMeasurements } from '../storage/bodyMeasurements';
import { useTheme } from '../context/ThemeContext';
import { spacing, radius, typography } from '../theme';
import { AppCard } from '../components/ui/AppCard';
import { AppScreen } from '../components/ui/AppScreen';
import { Button } from '../components/ui/Button';
import { SkeletonBlock } from '../components/ui/SkeletonBlock';
import { AnimatedEntrance } from '../components/ui/AnimatedEntrance';

function formatLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

export function EvolutionChartsScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: colors.surface,
      backgroundGradientTo: colors.surface,
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      strokeWidth: 2,
      decimalPlaces: 1,
      labelColor: () => colors.textMuted,
      propsForDots: { r: '4', strokeWidth: '1', stroke: colors.primary },
    }),
    [colors]
  );
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - spacing.xl * 2, 340);
  const [weightLogs, setWeightLogs] = useState<{ date: string; valueKg: number }[]>([]);
  const [measurements, setMeasurements] = useState<
    { date: string; waistCm?: number; hipCm?: number; armLeftCm?: number }[]
  >([]);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const load = async (withInitialLoader = false) => {
    if (withInitialLoader) setInitialLoading(true);
    try {
      const [w, m] = await Promise.all([getWeightLogs(), getBodyMeasurements()]);
      setWeightLogs(w.map((e) => ({ date: e.date, valueKg: e.valueKg })));
      setMeasurements(
        m.map((e) => ({
          date: e.date,
          waistCm: e.waistCm ?? undefined,
          hipCm: e.hipCm ?? undefined,
          armLeftCm: e.armLeftCm ?? undefined,
        }))
      );
    } finally {
      if (withInitialLoader) setInitialLoading(false);
    }
  };

  useEffect(() => {
    load(true);
  }, []);

  const weightPoints = weightLogs.slice(-10);
  const weightData = {
    labels: weightPoints.map((e) => formatLabel(e.date)),
    datasets: [
      {
        data:
          weightPoints.length > 0
            ? weightPoints.map((e) => e.valueKg)
            : [0],
      },
    ],
  };

  const waistPoints = measurements.filter((e) => e.waistCm != null).slice(-10);
  const waistChartData = {
    labels: waistPoints.map((e) => formatLabel(e.date)),
    datasets: [
      {
        data: waistPoints.length > 0 ? waistPoints.map((e) => e.waistCm as number) : [0],
      },
    ],
  };
  const hasMeasures = measurements.some(
    (e) => e.waistCm != null || e.hipCm != null || e.armLeftCm != null
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
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
        <Text style={styles.heroTitle}>Gráficos de evolução</Text>
        <Text style={styles.heroSubtitle}>
          Acompanhe tendência de peso e medidas para entender seu progresso ao longo das semanas.
        </Text>
        <Button
          title="Atualizar gráficos"
          onPress={onRefresh}
          loading={refreshing}
          disabled={refreshing}
          accessibilityLabel="Atualizar gráficos"
        />
        </AppCard>
      </AnimatedEntrance>

      <AnimatedEntrance delay={50}>
        <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Peso (kg)</Text>
        {initialLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonBlock style={styles.skeletonChart} />
          </View>
        ) : weightLogs.length < 2 ? (
          <Text style={styles.hint}>
            Registre pelo menos dois pesos para ver o gráfico.
          </Text>
        ) : (
          <View style={styles.chartWrap}>
            <LineChart
              data={weightData}
              width={chartWidth}
              height={200}
              yAxisSuffix=" kg"
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines
              withOuterLines
            />
          </View>
        )}
        </AppCard>
      </AnimatedEntrance>

      <AnimatedEntrance delay={90}>
        <AppCard style={styles.section}>
        <Text style={styles.sectionTitle}>Medidas corporais (cm)</Text>
        {initialLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonBlock style={styles.skeletonChart} />
          </View>
        ) : !hasMeasures || waistPoints.length < 2 ? (
          <Text style={styles.hint}>
            Registre medidas corporais (cintura, quadril, braço) para ver a
            evolução.
          </Text>
        ) : (
          <View style={styles.chartWrap}>
            <LineChart
              data={waistChartData}
              width={chartWidth}
              height={200}
              yAxisSuffix=" cm"
              chartConfig={{ ...chartConfig, color: () => colors.success }}
              bezier
              style={styles.chart}
              withInnerLines
              withOuterLines
            />
            <Text style={styles.chartLegend}>Cintura</Text>
          </View>
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
    heroCard: { marginBottom: spacing.xl },
    heroTitle: { ...typography.titleSmall, color: colors.text, marginBottom: spacing.xs },
    heroSubtitle: { fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.lg },
    section: { marginBottom: spacing.xl },
    sectionTitle: {
      ...typography.sectionTitle,
      color: colors.textSecondary,
      marginBottom: spacing.md,
    },
    hint: { fontSize: 14, color: colors.textMuted },
    chartWrap: { marginTop: spacing.sm },
    skeletonWrap: { marginTop: spacing.sm },
    skeletonChart: { width: '100%', height: 200 },
    chart: { borderRadius: radius.md },
    chartLegend: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
  });
}
