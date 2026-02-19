import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface LineDataPoint {
  date: string;
  label: string;
  value: number;
}

interface LineChartProps {
  data: LineDataPoint[];
  dataKey?: string;
  color?: string;
  yAxisLabel?: string;
  xAxisLabel?: string;
}

export function LineChart({
  data,
  dataKey = 'value',
  color = '#0ea5e9',
  yAxisLabel,
  xAxisLabel,
}: LineChartProps) {
  if (!data.length) return null;

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12, fill: 'var(--color-content-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
            label={xAxisLabel ? { value: xAxisLabel, position: 'insideBottom', offset: -5 } : undefined}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'var(--color-content-muted)' }}
            tickLine={false}
            axisLine={false}
            width={40}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft' } : undefined}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              fontSize: 12,
            }}
            formatter={(value: number) => [value, yAxisLabel || 'Valor']}
            labelFormatter={(label) => label}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={{ fill: color, r: 4 }}
            activeDot={{ r: 6 }}
            isAnimationActive
            animationDuration={800}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
