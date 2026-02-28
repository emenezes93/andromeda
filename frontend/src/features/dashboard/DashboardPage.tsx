import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getStoredUser } from '@/stores/authStore';
import { useTranslation } from '@/hooks/useTranslation';
import { listSessions } from '@/api/sessions';
import { listPatients } from '@/api/patients';
import { listGoals } from '@/api/goals';
import { getDashboardStats } from '@/api/stats';
import type { Session } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SessionStatusBadge } from '@/components/ui/SessionStatusBadge';
import { IconSessions, IconTemplates, IconPatients, IconGoals } from '@/components/icons';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  SessionsByDayChart,
  SessionsByTemplateChart,
  type DayCount,
  type TemplateCount,
} from '@/components/charts';
import { AchievementsCard } from '@/components/gamification/AchievementsCard';
import { PlanUsageCard } from '@/components/ui/PlanUsageCard';
import { NotificationsWidget } from '@/components/ui/NotificationsWidget';

const PERIOD_OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
] as const;

export function DashboardPage() {
  const user = getStoredUser();
  const { t } = useTranslation();
  const [periodDays, setPeriodDays] = useState<number>(30);

  function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return t.dashboard.greetingMorning;
    if (h < 18) return t.dashboard.greetingAfternoon;
    return t.dashboard.greetingEvening;
  }

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['dashboard-sessions'],
    queryFn: () => listSessions({ page: 1, limit: 5 }),
  });

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['dashboard-stats', periodDays],
    queryFn: () => getDashboardStats({ days: periodDays }),
  });

  const { data: patientsData, isLoading: loadingPatients } = useQuery({
    queryKey: ['dashboard-patients'],
    queryFn: () => listPatients({ page: 1, limit: 1 }),
  });

  const { data: goalsData, isLoading: loadingGoals } = useQuery({
    queryKey: ['dashboard-goals-active'],
    queryFn: () => listGoals({ limit: 1, achieved: false }),
  });

  const loading = loadingSessions || loadingStats;
  const sessions: Session[] = sessionsData?.data ?? [];
  const totalSessions = stats?.totals.sessions ?? null;
  const totalTemplates = stats?.totals.templates ?? null;
  const completedCount = stats?.totals.completed ?? null;
  const byDay = stats?.byDay ?? {};
  const byTemplate = stats?.byTemplate ?? [];

  const byDayFormatted: DayCount[] = useMemo(() => {
    return Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        label: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        count,
      }));
  }, [byDay]);

  const byTemplateFormatted: TemplateCount[] = useMemo(() => {
    return byTemplate.map((item) => ({
      name: item.templateName,
      count: item.count,
    }));
  }, [byTemplate]);

  const completedThisWeek = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return Object.entries(byDay).reduce((acc, [date, count]) => {
      const d = new Date(date);
      if (d >= weekAgo && d <= now) return acc + count;
      return acc;
    }, 0);
  }, [byDay]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const totalPatients = patientsData?.meta.total ?? null;
  const activeGoals = goalsData?.meta.total ?? null;

  const greeting = getGreeting();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-heading font-semibold text-content">
            {greeting}, <span className="text-primary">{user?.name || user?.email}</span>
          </h1>
          <p className="text-body-sm text-content-muted">
            {t.dashboard.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="period" className="text-body-sm text-content-muted">
              {t.dashboard.period}
            </label>
            <select
              id="period"
              className="rounded-button border border-border bg-surface px-3 py-1.5 text-body-sm text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              value={periodDays}
              onChange={(e) => setPeriodDays(Number(e.target.value))}
            >
              {PERIOD_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <Link to="/sessions/new">
            <Button size="sm">{t.dashboard.newSession}</Button>
          </Link>
        </div>
      </div>

      {/* Stats cards com ícones */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" className="border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconSessions className="size-5" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-content-muted">{t.dashboard.totalSessions}</p>
              {loading ? (
                <Skeleton height={32} width={60} className="mt-1" />
              ) : (
                <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">{totalSessions ?? 0}</p>
              )}
            </div>
          </div>
        </Card>
        <Card padding="md" className="border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconTemplates className="size-5" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-content-muted">{t.dashboard.activeTemplates}</p>
              {loading ? (
                <Skeleton height={32} width={60} className="mt-1" />
              ) : (
                <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">{totalTemplates ?? 0}</p>
              )}
            </div>
          </div>
        </Card>
        <Link to="/patients" className="block focus-visible:outline-none">
          <Card padding="md" className="h-full border-l-4 border-l-success transition-calm hover:shadow-soft">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success/10 text-success">
                <IconPatients className="size-5" />
              </div>
              <div>
                <p className="text-body-sm font-medium text-content-muted">{t.dashboard.patients}</p>
                {loadingPatients ? (
                  <Skeleton height={32} width={60} className="mt-1" />
                ) : (
                  <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">{totalPatients ?? 0}</p>
                )}
              </div>
            </div>
          </Card>
        </Link>
        <Link to="/goals/new" className="block focus-visible:outline-none">
          <Card padding="md" className="h-full border-l-4 border-l-warning transition-calm hover:shadow-soft">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-warning/10 text-warning">
                <IconGoals className="size-5" />
              </div>
              <div>
                <p className="text-body-sm font-medium text-content-muted">{t.dashboard.activeGoals}</p>
                {loadingGoals ? (
                  <Skeleton height={32} width={60} className="mt-1" />
                ) : (
                  <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">{activeGoals ?? 0}</p>
                )}
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Alertas / Notificações */}
      <NotificationsWidget />

      {/* Uso do plano */}
      <PlanUsageCard />

      {/* Conquistas (gamificação) */}
      <AchievementsCard
        completedTotal={completedCount}
        completedThisWeek={completedThisWeek}
        loading={loading}
      />

      {/* Gráficos interativos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title={t.dashboard.sessionsByDay} padding="md">
          <SessionsByDayChart data={byDayFormatted} loading={loading} />
        </Card>
        <Card title={t.dashboard.sessionsByTemplate} padding="md">
          <SessionsByTemplateChart data={byTemplateFormatted} loading={loading} />
        </Card>
      </div>

      {/* Tabela de sessões recentes */}
      <Card title={t.dashboard.recentSessions} padding="none">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="px-5 py-8 text-body text-content-muted">
            {t.dashboard.noSessionsYet}{' '}
            <Link to="/sessions/new" className="font-medium text-primary hover:underline">
              {t.dashboard.createFirstSession}
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b border-border-muted bg-surface-muted">
                  <th className="px-4 py-3 font-medium text-content-muted">{t.dashboard.date}</th>
                  <th className="px-4 py-3 font-medium text-content-muted">{t.dashboard.template}</th>
                  <th className="px-4 py-3 font-medium text-content-muted">{t.dashboard.status}</th>
                  <th className="px-4 py-3 font-medium text-content-muted">ID</th>
                  <th className="px-4 py-3 text-right font-medium text-content-muted">{t.dashboard.actions}</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border-muted transition-calm hover:bg-surface-muted"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                      {formatDate(s.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-medium text-content">
                      {s.template?.name ?? s.templateId.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3">
                      {s.status && <SessionStatusBadge status={s.status} />}
                    </td>
                    <td className="px-4 py-3 font-mono text-content-subtle">
                      {s.id.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/sessions/${s.id}`} className="mr-2">
                        <Button variant="ghost" size="sm">
                          {t.dashboard.view}
                        </Button>
                      </Link>
                      <Link to={`/sessions/${s.id}/flow`}>
                        <Button size="sm" variant="tactile">{t.dashboard.continue}</Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && sessions.length > 0 && (
          <div className="border-t border-border-muted px-4 py-3">
            <Link to="/sessions" className="text-body-sm font-medium text-primary hover:underline">
              {t.dashboard.viewAllSessions}
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
