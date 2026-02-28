import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listGoals } from '@/api/goals';
import { listSessions } from '@/api/sessions';
import type { Goal, Session } from '@/types';

interface Notification {
  id: string;
  type: 'overdue_goal' | 'stale_session';
  title: string;
  detail: string;
  href: string;
}

function useNotifications() {
  const { data: goalsData } = useQuery({
    queryKey: ['notifications-goals'],
    queryFn: () => listGoals({ achieved: false, limit: 100 }),
    staleTime: 5 * 60 * 1000,
  });

  const { data: sessionsData } = useQuery({
    queryKey: ['notifications-sessions'],
    queryFn: () => listSessions({ page: 1, limit: 100, status: 'in_progress' }),
    staleTime: 5 * 60 * 1000,
  });

  const notifications = useMemo<Notification[]>(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const result: Notification[] = [];

    // Overdue goals: targetDate < today, not achieved
    (goalsData?.data ?? []).forEach((goal: Goal) => {
      const targetDate = new Date(goal.targetDate);
      if (targetDate < now) {
        const daysOverdue = Math.floor((now.getTime() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
        result.push({
          id: `goal-${goal.id}`,
          type: 'overdue_goal',
          title: `Meta vencida: ${goal.title}`,
          detail: `Prazo há ${daysOverdue} dia${daysOverdue !== 1 ? 's' : ''}`,
          href: `/goals/${goal.id}/edit`,
        });
      }
    });

    // Stale in-progress sessions: created more than 7 days ago
    (sessionsData?.data ?? []).forEach((session: Session) => {
      const created = new Date(session.createdAt);
      if (created < sevenDaysAgo) {
        const daysOld = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
        const label = session.template?.name ?? session.id.slice(0, 8);
        result.push({
          id: `session-${session.id}`,
          type: 'stale_session',
          title: `Sessão incompleta: ${label}`,
          detail: `Aberta há ${daysOld} dia${daysOld !== 1 ? 's' : ''}`,
          href: `/sessions/${session.id}`,
        });
      }
    });

    return result;
  }, [goalsData, sessionsData]);

  return notifications;
}

export function NotificationsWidget() {
  const notifications = useNotifications();

  if (notifications.length === 0) return null;

  const overdueGoals = notifications.filter((n) => n.type === 'overdue_goal');
  const staleSessions = notifications.filter((n) => n.type === 'stale_session');

  return (
    <div className="rounded-card border border-warning/40 bg-warning/5 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warning text-white text-xs font-bold">
          {notifications.length}
        </span>
        <h3 className="text-body-sm font-semibold text-content">
          {notifications.length === 1 ? '1 alerta' : `${notifications.length} alertas`} pendentes
        </h3>
      </div>

      <ul className="space-y-2">
        {overdueGoals.length > 0 && (
          <li>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-muted">
              Metas vencidas ({overdueGoals.length})
            </p>
            <ul className="space-y-1">
              {overdueGoals.slice(0, 3).map((n) => (
                <li key={n.id}>
                  <Link
                    to={n.href}
                    className="flex items-start justify-between gap-2 rounded-button px-2 py-1.5 hover:bg-warning/10 transition-calm"
                  >
                    <span className="text-body-sm font-medium text-content">{n.title}</span>
                    <span className="shrink-0 text-xs text-content-muted">{n.detail}</span>
                  </Link>
                </li>
              ))}
              {overdueGoals.length > 3 && (
                <li className="px-2 text-xs text-content-muted">
                  +{overdueGoals.length - 3} metas vencidas adicionais
                </li>
              )}
            </ul>
          </li>
        )}

        {staleSessions.length > 0 && (
          <li>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-muted">
              Sessões incompletas ({staleSessions.length})
            </p>
            <ul className="space-y-1">
              {staleSessions.slice(0, 3).map((n) => (
                <li key={n.id}>
                  <Link
                    to={n.href}
                    className="flex items-start justify-between gap-2 rounded-button px-2 py-1.5 hover:bg-warning/10 transition-calm"
                  >
                    <span className="text-body-sm font-medium text-content">{n.title}</span>
                    <span className="shrink-0 text-xs text-content-muted">{n.detail}</span>
                  </Link>
                </li>
              ))}
              {staleSessions.length > 3 && (
                <li className="px-2 text-xs text-content-muted">
                  +{staleSessions.length - 3} sessões incompletas adicionais
                </li>
              )}
            </ul>
          </li>
        )}
      </ul>
    </div>
  );
}
