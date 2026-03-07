import { useState, useMemo } from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { PatientEvolution } from '@/types';

const METRICS: Array<{ key: string; label: string; unit: string; color: string }> = [
  { key: 'weightKg', label: 'Peso', unit: 'kg', color: 'var(--color-primary)' },
  { key: 'bodyFatPercent', label: 'Gordura corporal', unit: '%', color: 'var(--color-warning)' },
  { key: 'muscleMassKg', label: 'Massa muscular', unit: 'kg', color: '#10b981' },
  { key: 'waistCm', label: 'Cintura', unit: 'cm', color: 'var(--color-error)' },
  { key: 'hipCm', label: 'Quadril', unit: 'cm', color: '#8b5cf6' },
  { key: 'chestCm', label: 'Peitoral', unit: 'cm', color: '#06b6d4' },
  { key: 'armCm', label: 'Braço', unit: 'cm', color: '#ec4899' },
  { key: 'thighCm', label: 'Coxa', unit: 'cm', color: '#84cc16' },
  { key: 'bmi', label: 'IMC', unit: '', color: 'var(--color-content-muted)' },
];

interface EvolutionChartProps {
  evolutions: PatientEvolution[];
}

export function EvolutionChart({ evolutions }: EvolutionChartProps) {
  const [selected, setSelected] = useState<string[]>(['weightKg', 'bodyFatPercent']);

  const chartData = useMemo(() => {
    const sorted = [...evolutions].sort(
      (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
    );
    return sorted.map((evo) => {
      const point: Record<string, string | number | undefined> = {
        date: new Date(evo.recordedAt).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: 'short',
        }),
      };
      for (const m of METRICS) {
        const val = (evo as unknown as Record<string, unknown>)[m.key];
        if (val != null && typeof val === 'number') point[m.key] = val;
      }
      if (evo.weightKg != null && evo.bodyFatPercent != null) {
        point.leanMassKg = Number(
          (evo.weightKg * (1 - evo.bodyFatPercent / 100)).toFixed(1)
        );
      }
      return point;
    });
  }, [evolutions]);

  const toggleMetric = (key: string) => {
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  if (evolutions.length < 2) {
    return (
      <p className="italic text-body-sm text-content-muted">
        Registre pelo menos 2 evoluções para ver o gráfico comparativo.
      </p>
    );
  }

  const activeMetrics = METRICS.filter((m) => selected.includes(m.key));

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        {METRICS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => toggleMetric(m.key)}
            className={`rounded-button px-3 py-1 text-body-xs font-medium transition-calm ${
              selected.includes(m.key)
                ? 'bg-primary text-white'
                : 'bg-surface-muted text-content-muted hover:bg-surface-muted/80'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      {activeMetrics.length > 0 ? (
        <div className="h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLineChart
              data={chartData}
              margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--color-border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fill: 'var(--color-content-muted)' }}
                tickLine={false}
                axisLine={{ stroke: 'var(--color-border)' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--color-content-muted)' }}
                tickLine={false}
                axisLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                  fontSize: 12,
                }}
                labelFormatter={(label) => label}
              />
              <Legend />
              {activeMetrics.map((m) => (
                <Line
                  key={m.key}
                  type="monotone"
                  dataKey={m.key}
                  name={`${m.label} (${m.unit})`}
                  stroke={m.color}
                  strokeWidth={2}
                  dot={{ fill: m.color, r: 4 }}
                  activeDot={{ r: 6 }}
                  isAnimationActive
                  animationDuration={800}
                />
              ))}
            </RechartsLineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="text-body-sm text-content-muted">
          Selecione ao menos uma métrica.
        </p>
      )}
    </div>
  );
}
