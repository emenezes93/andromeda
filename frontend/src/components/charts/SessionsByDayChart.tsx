import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface DayCount {
  date: string;
  label: string;
  count: number;
}

interface SessionsByDayChartProps {
  data: DayCount[];
  loading?: boolean;
}

const PRIMARY = 'var(--color-primary)';
const PRIMARY_LIGHT = 'var(--color-primary-light)';

export function SessionsByDayChart({ data, loading }: SessionsByDayChartProps) {
  if (loading) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-card border border-border bg-surface-muted">
        <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="flex h-[260px] items-center justify-center rounded-card border border-border bg-surface-muted text-content-muted">
        Nenhum dado para exibir
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 12, right: 12, left: 0, bottom: 0 }}
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
            allowDecimals={false}
            tick={{ fontSize: 12, fill: 'var(--color-content-muted)' }}
            tickLine={false}
            axisLine={false}
            width={24}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              fontSize: 12,
            }}
            labelStyle={{ color: 'var(--color-content-muted)' }}
            formatter={(value: number) => [value, 'Sessões']}
            labelFormatter={(label) => `Data: ${label}`}
          />
          <Bar
            dataKey="count"
            name="Sessões"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          >
            {data.map((_, index) => (
              <Cell key={index} fill={index === data.length - 1 ? PRIMARY : PRIMARY_LIGHT} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
