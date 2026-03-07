import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

export interface PieDataPoint {
  name: string;
  value: number;
  color?: string;
}

interface PieChartProps {
  data: PieDataPoint[];
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
}

const DEFAULT_COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-error)',
  'var(--color-info)',
  'var(--color-success-light)',
  'var(--color-warning-light)',
  'var(--color-error-light)',
];

export function PieChart({
  data,
  colors = DEFAULT_COLORS,
  innerRadius = 0,
  outerRadius = 80,
}: PieChartProps) {
  if (!data.length) return null;

  const chartData = data.map((d, i) => ({
    ...d,
    color: d.color ?? colors[i % colors.length],
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="var(--color-border)"
            dataKey="value"
            isAnimationActive
            animationDuration={800}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
            }}
            formatter={(value: number) => [value, 'Quantidade']}
          />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            iconType="circle"
            formatter={(value) => <span style={{ color: 'var(--color-content)' }}>{value}</span>}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}
