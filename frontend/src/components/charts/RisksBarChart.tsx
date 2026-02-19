import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';

export interface RiskItem {
  label: string;
  value: number;
  key: string;
}

interface RisksBarChartProps {
  data: RiskItem[];
  maxValue?: number;
}

const PRIMARY = 'var(--color-primary)';
const PRIMARY_LIGHT = 'var(--color-primary-subtle)';
const WARNING = 'var(--color-warning)';
const ERROR = 'var(--color-error)';

function colorFor(value: number, key: string): string {
  if (value >= 70 && (key === 'stress' || key === 'dropoutRisk')) return ERROR;
  if (value >= 60 && (key === 'stress' || key === 'dropoutRisk')) return WARNING;
  if (key === 'readiness' || key === 'sleepQuality') {
    if (value < 40) return WARNING;
    if (value < 60) return PRIMARY_LIGHT;
  }
  return PRIMARY;
}

export function RisksBarChart({ data, maxValue = 100 }: RisksBarChartProps) {
  if (!data.length) return null;

  const chartData = data.map((d) => ({ ...d, fill: colorFor(d.value, d.key) }));

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
          accessibilityLayer
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: 'var(--color-content-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <YAxis
            domain={[0, maxValue]}
            tick={{ fontSize: 12, fill: 'var(--color-content-muted)' }}
            tickLine={false}
            axisLine={false}
            width={28}
          />
          <ReferenceLine y={50} stroke="var(--color-border-soft)" strokeDasharray="2 2" />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              fontSize: 12,
            }}
            formatter={(value: number) => [value, 'Valor (0–100)']}
            labelFormatter={(label) => label}
          />
          <Bar
            dataKey="value"
            name="Valor"
            radius={[4, 4, 0, 0]}
            maxBarSize={56}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
