import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getStoredUser } from '@/stores/authStore';
import { listSessions } from '@/api/sessions';
import { listTemplates } from '@/api/templates';
import type { Session } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SessionStatusBadge } from '@/components/ui/SessionStatusBadge';
import { IconSessions, IconTemplates } from '@/components/icons';
import {
  SessionsByDayChart,
  SessionsByTemplateChart,
  type DayCount,
  type TemplateCount,
} from '@/components/charts';
import { AchievementsCard } from '@/components/gamification/AchievementsCard';

const CHART_SESSIONS_LIMIT = 30;

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
}

export function DashboardPage() {
  const user = getStoredUser();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [chartSessions, setChartSessions] = useState<Session[]>([]);
  const [totalSessions, setTotalSessions] = useState<number | null>(null);
  const [totalTemplates, setTotalTemplates] = useState<number | null>(null);
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      listSessions({ page: 1, limit: 5 }),
      listSessions({ page: 1, limit: CHART_SESSIONS_LIMIT }),
      listSessions({ status: 'completed', page: 1, limit: 1 }),
      listTemplates({ page: 1, limit: 1 }),
    ])
      .then(([recentRes, chartRes, completedRes, templatesRes]) => {
        if (!cancelled) {
          setSessions(recentRes.data);
          setChartSessions(chartRes.data);
          setTotalSessions(recentRes.meta?.total ?? 0);
          setCompletedCount(completedRes.meta?.total ?? 0);
          setTotalTemplates(templatesRes.meta?.total ?? 0);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSessions([]);
          setChartSessions([]);
          setTotalSessions(0);
          setCompletedCount(0);
          setTotalTemplates(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const byDay: DayCount[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of chartSessions) {
      const date = s.createdAt.slice(0, 10);
      map.set(date, (map.get(date) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        date,
        label: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
        }),
        count,
      }));
  }, [chartSessions]);

  const byTemplate: TemplateCount[] = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of chartSessions) {
      const name = s.template?.name ?? s.templateId;
      map.set(name, (map.get(name) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [chartSessions]);

  const completedThisWeek = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return chartSessions.filter(
      (s) => s.status === 'completed' && new Date(s.createdAt) >= weekAgo
    ).length;
  }, [chartSessions]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const greeting = getGreeting();

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-heading font-semibold text-content">
          {greeting}, <span className="text-primary">{user?.name || user?.email}</span>
        </h1>
        <p className="text-body-sm text-content-muted">
          Acompanhe suas sessões, conquistas e métricas abaixo.
        </p>
      </div>

      {/* Stats cards com ícones */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card padding="md" className="border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconSessions className="size-5" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-content-muted">Total de sessões</p>
              <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">
                {loading ? '—' : totalSessions ?? 0}
              </p>
            </div>
          </div>
        </Card>
        <Card padding="md" className="border-l-4 border-l-primary">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <IconTemplates className="size-5" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-content-muted">Templates ativos</p>
              <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">
                {loading ? '—' : totalTemplates ?? 0}
              </p>
            </div>
          </div>
        </Card>
        <Link to="/sessions/new" className="block focus-visible:outline-none">
          <Card padding="md" className="h-full transition-calm hover:shadow-soft hover:border-primary/30">
            <p className="text-body-sm font-medium text-content-muted">Nova sessão</p>
            <p className="mt-1 text-body font-medium text-primary">Iniciar anamnese →</p>
          </Card>
        </Link>
      </div>

      {/* Conquistas (gamificação) */}
      <AchievementsCard
        completedTotal={completedCount}
        completedThisWeek={completedThisWeek}
        loading={loading}
      />

      {/* Gráficos interativos */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Sessões nos últimos dias" padding="md">
          <SessionsByDayChart data={byDay} loading={loading} />
        </Card>
        <Card title="Sessões por template" padding="md">
          <SessionsByTemplateChart data={byTemplate} loading={loading} />
        </Card>
      </div>

      {/* Tabela de sessões recentes */}
      <Card title="Sessões recentes" padding="none">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="px-5 py-8 text-body text-content-muted">
            Nenhuma sessão ainda.{' '}
            <Link to="/sessions/new" className="font-medium text-primary hover:underline">
              Criar primeira sessão
            </Link>
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b border-border-muted bg-surface-muted">
                  <th className="px-4 py-3 font-medium text-content-muted">Data</th>
                  <th className="px-4 py-3 font-medium text-content-muted">Template</th>
                  <th className="px-4 py-3 font-medium text-content-muted">Status</th>
                  <th className="px-4 py-3 font-medium text-content-muted">ID</th>
                  <th className="px-4 py-3 text-right font-medium text-content-muted">Ações</th>
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
                          Ver
                        </Button>
                      </Link>
                      <Link to={`/sessions/${s.id}/flow`}>
                        <Button size="sm" variant="tactile">Continuar</Button>
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
              Ver todas as sessões →
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
