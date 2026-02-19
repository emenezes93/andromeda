import {
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from 'recharts';

export interface RadarDataPoint {
  category: string;
  value: number;
  fullMark?: number;
}

interface RadarChartProps {
  data: RadarDataPoint[];
  maxValue?: number;
  colors?: string[];
}

export function RadarChart({ data, maxValue = 100, colors = ['#0ea5e9'] }: RadarChartProps) {
  if (!data.length) return null;

  const chartData = data.map((d) => ({
    ...d,
    fullMark: d.fullMark ?? maxValue,
  }));

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={chartData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
          <PolarGrid stroke="var(--color-border)" />
          <PolarAngleAxis
            dataKey="category"
            tick={{ fontSize: 11, fill: 'var(--color-content-muted)' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxValue]}
            tick={{ fontSize: 10, fill: 'var(--color-content-subtle)' }}
          />
          <Radar
            name="Valor"
            dataKey="value"
            stroke={colors[0]}
            fill={colors[0]}
            fillOpacity={0.3}
            strokeWidth={2}
            isAnimationActive
            animationDuration={800}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}
