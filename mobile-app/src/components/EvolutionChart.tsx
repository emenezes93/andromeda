/**
 * Gráfico de linha reutilizável para evolução (peso, volume, 1RM).
 * Suporta período 30/60/90 dias, média móvel e linha de meta opcional.
 */
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { spacing, radius, typography } from '../theme';
import { useTheme } from '../context/ThemeContext';

export interface EvolutionChartPoint {
  date: string;
  value: number;
}

export type EvolutionChartPeriod = 30 | 60 | 90;

function formatLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function movingAverage(points: EvolutionChartPoint[], window: number): EvolutionChartPoint[] {
  if (points.length < window) return points;
  const result: EvolutionChartPoint[] = [];
  for (let i = window - 1; i < points.length; i++) {
    let sum = 0;
    for (let j = 0; j < window; j++) sum += points[i - j].value;
    result.push({ date: points[i].date, value: Math.round((sum / window) * 10) / 10 });
  }
  return result;
}

export interface EvolutionChartProps {
  /** Pontos ordenados por data (mais antigo primeiro) */
  data: EvolutionChartPoint[];
  period: EvolutionChartPeriod;
  onPeriodChange: (period: EvolutionChartPeriod) => void;
  /** Exibir linha de tendência (média móvel) */
  showMovingAverage?: boolean;
  /** Janela da média móvel em dias */
  movingAverageDays?: number;
  /** Valor da meta (linha horizontal opcional) */
  goalValue?: number | null;
  /** Sufixo do eixo Y (ex: " kg") */
  yAxisSuffix?: string;
  /** Textos de marcos ex: { min: "Mínimo: 74,2 kg", diff: "Perda total: 3,8 kg" } */
  milestones?: { min?: string; max?: string; diff?: string };
}

export function EvolutionChart({
  data,
  period,
  onPeriodChange,
  showMovingAverage = false,
  movingAverageDays = 7,
  goalValue,
  yAxisSuffix = '',
  milestones,
}: EvolutionChartProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { width } = useWindowDimensions();
  const chartWidth = Math.min(width - spacing.xl * 2, 360);
  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: colors.surface,
      backgroundGradientTo: colors.surface,
      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
      strokeWidth: 2,
      decimalPlaces: 1,
      labelColor: () => colors.textMuted,
      propsForDots: { r: '3', strokeWidth: '1', stroke: colors.primary },
    }),
    [colors]
  );

  const { filtered, trendPoints, goalPoints, chartData } = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - period);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const filtered = data.filter((p) => p.date >= cutoffStr).sort((a, b) => a.date.localeCompare(b.date));
    if (filtered.length === 0) {
      return {
        filtered: [],
        trendPoints: [],
        goalPoints: [],
        chartData: { labels: [], datasets: [{ data: [0] }] },
      };
    }
    const trendPoints = showMovingAverage && filtered.length >= movingAverageDays
      ? movingAverage(filtered, movingAverageDays)
      : [];
    const goalPoints = goalValue != null && goalValue > 0
      ? filtered.map((p) => ({ ...p, value: goalValue }))
      : [];
    const labels = filtered.map((p) => formatLabel(p.date));
    const mainData = filtered.map((p) => p.value);
    const datasets: { data: number[] }[] = [{ data: mainData }];
    if (trendPoints.length > 0) {
      const trendData = filtered.map((p) => {
        const t = trendPoints.find((t) => t.date === p.date);
        return t != null ? t.value : mainData[filtered.indexOf(p)];
      });
      datasets.push({ data: trendData });
    }
    if (goalPoints.length > 0) {
      datasets.push({ data: goalPoints.map(() => goalValue!) });
    }
    return {
      filtered,
      trendPoints,
      goalPoints,
      chartData: { labels, datasets },
    };
  }, [data, period, showMovingAverage, movingAverageDays, goalValue]);

  if (filtered.length < 2) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>
          Registre pelo menos dois pontos no período para ver o gráfico.
        </Text>
      </View>
    );
  }

  const hasMultipleDatasets = chartData.datasets.length > 1;
  const config = hasMultipleDatasets
    ? {
        ...chartConfig,
        color: (opacity = 1, index?: number) => {
          if (index === 1) return `rgba(34, 197, 94, ${opacity})`;
          if (index === 2) return `rgba(148, 163, 184, ${opacity})`;
          return `rgba(59, 130, 246, ${opacity})`;
        },
      }
    : chartConfig;

  return (
    <View style={styles.wrap}>
      <View style={styles.periodRow}>
        {([30, 60, 90] as const).map((d) => (
          <TouchableOpacity
            key={d}
            style={[styles.periodBtn, period === d && styles.periodBtnActive]}
            onPress={() => onPeriodChange(d)}
          >
            <Text style={[styles.periodBtnText, period === d && styles.periodBtnTextActive]}>{d} dias</Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.chartWrap}>
        <LineChart
          data={chartData}
          width={chartWidth}
          height={220}
          yAxisSuffix={yAxisSuffix}
          chartConfig={config}
          bezier
          style={styles.chart}
          withInnerLines
          withOuterLines
          fromZero={false}
        />
      </View>
      {showMovingAverage && trendPoints.length > 0 && (
        <Text style={styles.legend}>Verde = média móvel {movingAverageDays} dias</Text>
      )}
      {milestones && (milestones.min || milestones.max || milestones.diff) && (
        <View style={styles.milestones}>
          {milestones.min != null && <Text style={styles.milestoneText}>{milestones.min}</Text>}
          {milestones.max != null && <Text style={styles.milestoneText}>{milestones.max}</Text>}
          {milestones.diff != null && <Text style={styles.milestoneText}>{milestones.diff}</Text>}
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    wrap: { marginVertical: spacing.sm },
    periodRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    periodBtn: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    periodBtnActive: { backgroundColor: colors.primaryLight, borderColor: colors.primary },
    periodBtnText: { fontSize: 14, color: colors.textMuted },
    periodBtnTextActive: { color: colors.primary, fontWeight: '600' },
    chartWrap: { marginTop: spacing.sm },
    chart: { borderRadius: radius.md },
    legend: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm },
    placeholder: { padding: spacing.lg },
    placeholderText: { fontSize: 14, color: colors.textMuted },
    milestones: { marginTop: spacing.md, gap: 4 },
    milestoneText: { fontSize: 13, color: colors.textSecondary },
  });
}
