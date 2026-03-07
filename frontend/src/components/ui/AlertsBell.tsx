import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listAlerts, markAlertRead } from '@/api/alerts';
import type { Alert } from '@/api/alerts';
import { track } from '@/lib/analytics';
import { IconBell } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMs / 3600000);
  const diffD = Math.floor(diffMs / 86400000);
  if (diffM < 60) return `${diffM} min`;
  if (diffH < 24) return `${diffH}h`;
  if (diffD < 7) return `${diffD}d`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function severityVariant(severity: Alert['severity']): 'error' | 'warning' | 'default' | 'primary' {
  if (severity === 'high') return 'error';
  if (severity === 'medium') return 'warning';
  return 'default';
}

export function AlertsBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['alerts', 'header', 10],
    queryFn: () => listAlerts({ limit: 10, page: 1 }),
    staleTime: 60 * 1000,
  });

  const alerts = data?.data ?? [];
  const unreadCount = data?.meta.unreadCount ?? 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    try {
      await markAlertRead(id);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    } catch {
      // ignore
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex min-h-touch min-w-[40px] items-center justify-center rounded-button text-content-muted hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label={unreadCount > 0 ? `${unreadCount} alertas não lidos` : 'Alertas'}
        aria-expanded={open}
      >
        <IconBell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 overflow-hidden rounded-card border border-border bg-surface shadow-card">
          <div className="border-b border-border-muted px-3 py-2">
            <h3 className="text-body-sm font-semibold text-content">Alertas</h3>
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-6">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : alerts.length === 0 ? (
              <p className="px-3 py-4 text-body-sm text-content-muted">Nenhum alerta.</p>
            ) : (
              <ul className="divide-y divide-border-muted">
                {alerts.map((a) => {
                  const sessionId =
                    a.type === 'reassessment_scheduled' &&
                    a.metadata &&
                    typeof a.metadata.sessionId === 'string'
                      ? a.metadata.sessionId
                      : null;
                  const to = sessionId
                    ? `/sessions/${sessionId}`
                    : `/patients/${a.patientId}/hub`;
                  const handleRowClick = () => {
                    navigate(to);
                    if (!a.readAt) void handleMarkRead(a.id);
                    setOpen(false);
                  };
                  return (
                    <li key={a.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={handleRowClick}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleRowClick();
                          }
                        }}
                        className="block cursor-pointer px-3 py-2.5 text-left transition-calm hover:bg-surface-muted"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-body-sm font-medium text-content">{a.patientName}</span>
                          {!a.readAt && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-body-xs text-content-muted">{a.message}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant={severityVariant(a.severity)} className="text-[10px]">
                            {a.severity}
                          </Badge>
                          <span className="text-body-xs text-content-subtle">{formatRelative(a.createdAt)}</span>
                        </div>
                        {/* Ação direta por tipo de alerta */}
                        {a.type === 'inactivity' && (
                          <Link
                            to={`/sessions/new?patientId=${a.patientId}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              track({ name: 'alert_action_clicked', alertType: a.type, alertId: a.id });
                              if (!a.readAt) void handleMarkRead(a.id);
                              setOpen(false);
                            }}
                            className="mt-1.5 inline-flex items-center gap-1 rounded-button bg-primary-subtle px-2 py-1 text-body-xs font-medium text-primary transition-calm hover:bg-primary/10"
                          >
                            Enviar check-in →
                          </Link>
                        )}
                        {a.type === 'goal_expiring' && a.metadata && typeof (a.metadata as { goalId?: string }).goalId === 'string' && (
                          <Link
                            to={`/goals/${(a.metadata as { goalId: string }).goalId}/edit`}
                            onClick={(e) => {
                              e.stopPropagation();
                              track({ name: 'alert_action_clicked', alertType: a.type, alertId: a.id });
                              if (!a.readAt) void handleMarkRead(a.id);
                              setOpen(false);
                            }}
                            className="mt-1.5 inline-flex items-center gap-1 rounded-button bg-warning-subtle px-2 py-1 text-body-xs font-medium text-warning transition-calm hover:bg-warning/10"
                          >
                            Atualizar meta →
                          </Link>
                        )}
                        {a.type === 'adherence_drop' && (
                          <Link
                            to={`/training-plans?patientId=${a.patientId}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              track({ name: 'alert_action_clicked', alertType: a.type, alertId: a.id });
                              if (!a.readAt) void handleMarkRead(a.id);
                              setOpen(false);
                            }}
                            className="mt-1.5 inline-flex items-center gap-1 rounded-button bg-error-light px-2 py-1 text-body-xs font-medium text-error transition-calm hover:bg-error/10"
                          >
                            Ver treino →
                          </Link>
                        )}
                        {a.type === 'reassessment_scheduled' && (
                          <Link
                            to={`/patients/${a.patientId}/evolution`}
                            onClick={(e) => {
                              e.stopPropagation();
                              track({ name: 'alert_action_clicked', alertType: a.type, alertId: a.id });
                              if (!a.readAt) void handleMarkRead(a.id);
                              setOpen(false);
                            }}
                            className="mt-1.5 inline-flex items-center gap-1 rounded-button bg-primary-subtle px-2 py-1 text-body-xs font-medium text-primary transition-calm hover:bg-primary/10"
                          >
                            Registrar evolução →
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {alerts.length > 0 && (
            <div className="border-t border-border-muted px-3 py-2">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="text-body-sm font-medium text-primary hover:underline"
              >
                Ver todos no dashboard
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
