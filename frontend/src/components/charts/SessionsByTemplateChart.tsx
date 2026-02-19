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

export interface TemplateCount {
  name: string;
  count: number;
}

interface SessionsByTemplateChartProps {
  data: TemplateCount[];
  loading?: boolean;
}

const COLORS = [
  'var(--color-primary)',
  'var(--color-primary-light)',
  'var(--color-primary-subtle)',
  'var(--color-content-subtle)',
];

export function SessionsByTemplateChart({ data, loading }: SessionsByTemplateChartProps) {
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

  const chartData = data.map((d) => ({
    ...d,
    shortName: d.name.length > 20 ? d.name.slice(0, 18) + '…' : d.name,
  }));

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 12, left: 8, bottom: 8 }}
          accessibilityLayer
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={false} />
          <XAxis
            type="number"
            allowDecimals={false}
            tick={{ fontSize: 12, fill: 'var(--color-content-muted)' }}
            tickLine={false}
            axisLine={{ stroke: 'var(--color-border)' }}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fontSize: 11, fill: 'var(--color-content)' }}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              fontSize: 12,
            }}
            formatter={(value: number, _n: string, props: { payload?: { name: string } }) => [
              value,
              props.payload?.name ?? '',
            ]}
            labelFormatter={() => 'Sessões'}
          />
          <Bar
            dataKey="count"
            name="Sessões"
            radius={[0, 4, 4, 0]}
            maxBarSize={24}
            isAnimationActive
            animationDuration={800}
            animationEasing="ease-out"
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
