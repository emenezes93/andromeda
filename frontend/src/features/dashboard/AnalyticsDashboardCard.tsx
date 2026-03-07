import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAnalyticsDashboard } from '@/api/stats';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { track } from '@/lib/analytics';

function adherenceBarColor(pct: number): string {
  if (pct >= 70) return 'bg-primary';
  if (pct >= 40) return 'bg-warning';
  return 'bg-error';
}

interface AnalyticsDashboardCardProps {
  periodDays: number;
}

export function AnalyticsDashboardCard({ periodDays }: AnalyticsDashboardCardProps) {
  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ['analytics-dashboard', periodDays],
    queryFn: () => getAnalyticsDashboard(periodDays),
  });

  useEffect(() => {
    if (!isSuccess || !data) return;
    track({ name: 'analytics_dashboard_viewed', periodDays });
  }, [isSuccess, data, periodDays]);

  if (isLoading) {
    return (
      <section aria-labelledby="analytics-dashboard-heading">
        <h2
          id="analytics-dashboard-heading"
          className="mb-4 text-heading-sm font-semibold text-content"
        >
          Dashboard analítico
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="md" className="border-l-4 border-border-muted">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="mt-2 h-8 w-24" />
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (!data) return null;

  const trend = data.trendVsPrevious;
  const activeDelta = trend.activeStudentsDelta;
  const sessionsDelta = trend.sessionsDelta;

  return (
    <section aria-labelledby="analytics-dashboard-heading">
      <h2
        id="analytics-dashboard-heading"
        className="mb-4 text-heading-sm font-semibold text-content"
      >
        Dashboard analítico
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          padding="md"
          className="border-l-4 border-primary"
        >
          <p className="text-body-sm font-medium text-content-muted">Alunos ativos</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-heading-md font-semibold text-content">
              {data.activeStudents}
            </span>
            {activeDelta !== 0 && (
              <span
                className={
                  activeDelta > 0
                    ? 'text-body-sm font-medium text-success'
                    : 'text-body-sm font-medium text-error'
                }
              >
                {activeDelta > 0 ? '↑' : '↓'} {Math.abs(activeDelta)}%
              </span>
            )}
          </div>
        </Card>

        <Card
          padding="md"
          className="border-l-4 border-warning"
        >
          <p className="text-body-sm font-medium text-content-muted">Risco de churn</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-heading-md font-semibold text-content">
              {data.churnRiskStudents}
            </span>
            {data.churnRiskStudents > 0 && (
              <Badge variant={data.churnRiskStudents > 3 ? 'error' : 'warning'}>
                {data.churnRiskStudents > 3 ? 'Atenção' : 'Monitorar'}
              </Badge>
            )}
          </div>
        </Card>

        <Card
          padding="md"
          className="border-l-4 border-primary"
        >
          <p className="text-body-sm font-medium text-content-muted">Aderência treino</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-heading-md font-semibold text-content">
              {data.averageTrainingAdherence}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className={`h-full rounded-full ${adherenceBarColor(data.averageTrainingAdherence)}`}
              style={{ width: `${Math.min(100, data.averageTrainingAdherence)}%` }}
            />
          </div>
        </Card>

        <Card
          padding="md"
          className="border-l-4 border-primary"
        >
          <p className="text-body-sm font-medium text-content-muted">Aderência dieta</p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-heading-md font-semibold text-content">
              {data.averageDietAdherence}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className={`h-full rounded-full ${adherenceBarColor(data.averageDietAdherence)}`}
              style={{ width: `${Math.min(100, data.averageDietAdherence)}%` }}
            />
          </div>
        </Card>

        <Card
          padding="md"
          className="border-l-4 border-primary"
        >
          <p className="text-body-sm font-medium text-content-muted">Sessões completadas</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-heading-md font-semibold text-content">
              {data.sessionsCompletedThisPeriod}
            </span>
            {sessionsDelta !== 0 && (
              <span
                className={
                  sessionsDelta > 0
                    ? 'text-body-sm font-medium text-success'
                    : 'text-body-sm font-medium text-error'
                }
              >
                {sessionsDelta > 0 ? '↑' : '↓'} {Math.abs(sessionsDelta)}%
              </span>
            )}
          </div>
        </Card>

        <Card
          padding="md"
          className="border-l-4 border-success"
        >
          <p className="text-body-sm font-medium text-content-muted">Metas alcançadas</p>
          <p className="mt-1 text-heading-md font-semibold text-content">
            {data.goalsAchievedThisPeriod}
          </p>
        </Card>
      </div>
    </section>
  );
}
