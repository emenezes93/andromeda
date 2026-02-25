interface QuotaUsageBarProps {
  label: string;
  current: number;
  max: number | null;
}

export function QuotaUsageBar({ label, current, max }: QuotaUsageBarProps) {
  const unlimited = max === null;
  const percent = unlimited ? 0 : Math.min((current / max) * 100, 100);

  let barColor = 'bg-primary';
  let textColor = 'text-content';
  if (!unlimited) {
    if (percent >= 100) {
      barColor = 'bg-error';
      textColor = 'text-error';
    } else if (percent >= 80) {
      barColor = 'bg-warning';
      textColor = 'text-warning';
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-body-sm">
        <span className="font-medium text-content">{label}</span>
        <span className={`font-semibold tabular-nums ${textColor}`}>
          {current}
          {unlimited ? ' / ilimitado' : ` / ${max}`}
        </span>
      </div>
      {!unlimited && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
    </div>
  );
}
