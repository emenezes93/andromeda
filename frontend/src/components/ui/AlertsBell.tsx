import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { listAlerts, markAlertRead } from '@/api/alerts';
import type { Alert } from '@/api/alerts';
import { track } from '@/lib/analytics';
import { IconBell } from '@/components/icons';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

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

function severityLabel(severity: Alert['severity']): string {
  if (severity === 'high') return 'Alto';
  if (severity === 'medium') return 'Médio';
  return 'Baixo';
}

/** Exibe nome do aluno; se vier como ID numérico ou vazio, usa fallback */
function displayPatientName(patientName: string): string {
  if (!patientName || /^\d{10,}$/.test(patientName.trim())) return 'Aluno';
  return patientName.trim();
}

const DROPDOWN_WIDTH_PX = 280;
const GAP_PX = 8;
const VIEWPORT_MARGIN_PX = 16;
const MAX_DROPDOWN_HEIGHT_PX = 320;
const MIN_DROPDOWN_HEIGHT_PX = 120;
const INACTIVITY_TYPES = new Set(['inactive', 'inactivity']);
const GOAL_DUE_TYPES = new Set(['goal_due_soon', 'goal_expiring']);

type DropdownPosition = {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
};

export function AlertsBell() {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<DropdownPosition | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const toast = useToast();

  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['alerts', 'header', 10],
    queryFn: () => listAlerts({ limit: 10, page: 1 }),
    staleTime: 60 * 1000,
  });

  const alerts = data?.data ?? [];
  const unreadCount = data?.meta.unreadCount ?? 0;

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const width = Math.min(DROPDOWN_WIDTH_PX, viewportWidth - VIEWPORT_MARGIN_PX * 2);
    const left = Math.max(
      VIEWPORT_MARGIN_PX,
      Math.min(rect.right - width, viewportWidth - width - VIEWPORT_MARGIN_PX)
    );
    const availableBelow = viewportHeight - rect.bottom - GAP_PX - VIEWPORT_MARGIN_PX;
    const availableAbove = rect.top - GAP_PX - VIEWPORT_MARGIN_PX;
    const openUp = availableBelow < 220 && availableAbove > availableBelow;
    const maxHeight = Math.max(
      MIN_DROPDOWN_HEIGHT_PX,
      Math.min(MAX_DROPDOWN_HEIGHT_PX, openUp ? availableAbove : availableBelow)
    );

    if (openUp) {
      setPosition({
        left,
        width,
        maxHeight,
        bottom: Math.max(VIEWPORT_MARGIN_PX, viewportHeight - rect.top + GAP_PX),
      });
      return;
    }

    setPosition({
      left,
      width,
      maxHeight,
      top: Math.max(VIEWPORT_MARGIN_PX, rect.bottom + GAP_PX),
    });
  }, []);

  useEffect(() => {
    if (!open) {
      setPosition(null);
      return;
    }
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);
    return () => {
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    try {
      await markAlertRead(id);
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    } catch {
      toast.error('Não foi possível marcar o alerta como lido.');
    }
  };

  const dropdownContent = open && position && (
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Lista de alertas"
      className="fixed z-[9999] overflow-hidden rounded-card border border-border bg-surface shadow-lg"
      style={{
        top: position.top,
        bottom: position.bottom,
        left: position.left,
        width: position.width,
        maxWidth: 'calc(100vw - 2rem)',
      }}
    >
          <div className="border-b border-border-muted bg-surface-muted/50 px-3 py-2.5">
            <h3 className="text-body-sm font-semibold text-content">Alertas</h3>
            <p className="mt-0.5 text-body-xs text-content-muted">
              {unreadCount > 0 ? `${unreadCount} não lido${unreadCount !== 1 ? 's' : ''}` : 'Todos lidos'}
            </p>
          </div>
          <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: position.maxHeight }}>
            {isLoading ? (
              <div className="flex justify-center py-6">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : alerts.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <p className="text-body-sm text-content-muted">Nenhum alerta no momento.</p>
                <p className="mt-1 text-body-xs text-content-subtle">Você verá aqui avisos de alunos e metas.</p>
              </div>
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
                    : `/patients/${a.patientId}`;
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
                        <div className="flex min-w-0 items-start justify-between gap-2">
                          <span className="min-w-0 truncate text-body-sm font-medium text-content" title={a.patientName || undefined}>
                            {displayPatientName(a.patientName)}
                          </span>
                          {!a.readAt && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 break-words text-body-xs text-content-muted" title={a.message}>
                          {a.message || 'Sem descrição'}
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <Badge variant={severityVariant(a.severity)} className="text-[10px]">
                            {severityLabel(a.severity)}
                          </Badge>
                          <span className="text-body-xs text-content-subtle">{formatRelative(a.createdAt)}</span>
                        </div>
                        {/* Ação direta por tipo de alerta */}
                        {INACTIVITY_TYPES.has(a.type) && (
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
                        {GOAL_DUE_TYPES.has(a.type) && a.metadata && typeof (a.metadata as { goalId?: string }).goalId === 'string' && (
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
            <div className="shrink-0 border-t border-border-muted bg-surface-muted/30 px-3 py-2.5">
              <Link
                to="/settings/notifications"
                onClick={() => setOpen(false)}
                className="block w-full break-words text-body-sm font-medium text-primary hover:underline"
              >
                Ver central de notificações
              </Link>
            </div>
          )}
          {alerts.length === 0 && !isLoading && (
            <div className="shrink-0 border-t border-border-muted px-3 py-2.5">
              <Link
                to="/settings/notifications"
                onClick={() => setOpen(false)}
                className="block w-full break-words text-body-sm font-medium text-primary hover:underline"
              >
                Configurar notificações
              </Link>
            </div>
          )}
    </div>
  );

  return (
    <>
      <div className="relative flex items-center justify-center" ref={triggerRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="relative flex min-h-touch min-w-[44px] items-center justify-center rounded-button text-content-muted hover:bg-surface-muted hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={unreadCount > 0 ? `${unreadCount} alertas não lidos` : 'Ver alertas'}
          aria-expanded={open}
          aria-haspopup="true"
        >
          <IconBell className="size-5 shrink-0" aria-hidden />
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white ring-2 ring-surface">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
      {typeof document !== 'undefined' &&
        createPortal(dropdownContent, document.body)}
    </>
  );
}
