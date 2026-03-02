import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  listScheduledQuestionnaires,
  deleteScheduledQuestionnaire,
  updateScheduledQuestionnaire,
} from '@/api/scheduled-questionnaires';
import type { ScheduledQuestionnaireListResponse, ScheduledQuestionnaire } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';

const LIMIT = 20;

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
};

const DAY_OF_WEEK_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function scheduleLabel(item: ScheduledQuestionnaire): string {
  const freq = FREQUENCY_LABELS[item.frequency] ?? item.frequency;
  if ((item.frequency === 'weekly' || item.frequency === 'biweekly') && item.dayOfWeek != null) {
    return `${freq} — ${DAY_OF_WEEK_LABELS[item.dayOfWeek]}`;
  }
  if (
    (item.frequency === 'monthly' || item.frequency === 'quarterly') &&
    item.dayOfMonth != null
  ) {
    return `${freq} — dia ${item.dayOfMonth}`;
  }
  return freq;
}

export function ScheduledQuestionnairesListPage() {
  const toast = useToast();
  const [data, setData] = useState<ScheduledQuestionnaireListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<ScheduledQuestionnaire | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchItems = useCallback(() => {
    setLoading(true);
    setError(null);
    listScheduledQuestionnaires({ page, limit: LIMIT, active: activeFilter })
      .then(setData)
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar agendamentos'),
      )
      .finally(() => setLoading(false));
  }, [page, activeFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  async function handleToggleActive(item: ScheduledQuestionnaire) {
    try {
      await updateScheduledQuestionnaire(item.id, { active: !item.active });
      toast.success(item.active ? 'Agendamento pausado.' : 'Agendamento reativado.');
      fetchItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao atualizar agendamento.');
    }
  }

  async function handleDelete(item: ScheduledQuestionnaire) {
    setPendingDelete(item);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteScheduledQuestionnaire(pendingDelete.id);
      toast.success('Agendamento removido.');
      fetchItems();
      setPendingDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover agendamento.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-64 animate-pulse rounded bg-surface-muted" />
          <div className="h-10 w-36 animate-pulse rounded bg-surface-muted" />
        </div>
        <div className="h-64 animate-pulse rounded-card bg-surface-muted" />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-card border border-error bg-error-light p-5 shadow-card">
        <p className="font-medium text-error">{error}</p>
        <Button className="mt-4" onClick={fetchItems}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const items = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {(['all', 'active', 'inactive'] as const).map((f) => {
            const value = f === 'all' ? undefined : f === 'active' ? true : false;
            const label = f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Pausados';
            const isActive = activeFilter === value;
            return (
              <button
                key={f}
                onClick={() => {
                  setActiveFilter(value);
                  setPage(1);
                }}
                className={`rounded-button px-3 py-1.5 text-body-sm font-medium transition-calm ${
                  isActive
                    ? 'bg-primary text-white'
                    : 'border border-border text-content-muted hover:bg-surface-muted'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
        <Link to="/scheduled-questionnaires/new">
          <Button>Novo agendamento</Button>
        </Link>
      </div>

      {error && data && (
        <div className="rounded-card border border-error bg-error-light px-4 py-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {meta && (
        <p className="text-sm text-content-muted">
          {meta.total === 0
            ? 'Nenhum agendamento encontrado'
            : `${meta.total} agendamento${meta.total !== 1 ? 's' : ''}`}
        </p>
      )}

      {loading && data && (
        <div className="flex justify-center py-2">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && items.length === 0 ? (
        <Card>
          <p className="text-content-muted">Nenhum agendamento cadastrado ainda.</p>
          <Link to="/scheduled-questionnaires/new">
            <Button className="mt-4">Novo agendamento</Button>
          </Link>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b border-border-muted bg-surface-muted">
                  <th className="px-4 py-3 font-medium text-content-muted">Template</th>
                  <th className="px-4 py-3 font-medium text-content-muted">Paciente</th>
                  <th className="px-4 py-3 font-medium text-content-muted">Frequência</th>
                  <th className="px-4 py-3 font-medium text-content-muted">Próximo envio</th>
                  <th className="px-4 py-3 font-medium text-content-muted">Último envio</th>
                  <th className="px-4 py-3 font-medium text-content-muted">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-content-muted">Ações</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-border-muted transition-calm last:border-0 hover:bg-surface-muted"
                  >
                    <td className="px-4 py-3 font-medium text-content">{item.templateName}</td>
                    <td className="px-4 py-3 text-content-muted">
                      {item.patientName ? (
                        <Link
                          to={`/patients/${item.patientId}`}
                          className="text-primary hover:underline"
                        >
                          {item.patientName}
                        </Link>
                      ) : (
                        <span className="italic text-content-subtle">Todos os pacientes</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-content">
                      {scheduleLabel(item)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                      {formatDateTime(item.nextRunAt)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                      {formatDateTime(item.lastRunAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.active ? 'success' : 'warning'}>
                        {item.active ? 'Ativo' : 'Pausado'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link to={`/scheduled-questionnaires/${item.id}/edit`}>
                          <Button variant="ghost" size="sm">
                            Editar
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(item)}
                        >
                          {item.active ? 'Pausar' : 'Ativar'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(item)}
                        >
                          Remover
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 border-t border-border-muted px-4 py-3">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-content-muted">
                Página {page} de {meta.totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= meta.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </Card>
      )}

      <ConfirmModal
        open={pendingDelete !== null}
        title="Remover agendamento"
        message={pendingDelete ? `Remover agendamento "${pendingDelete.templateName}"?` : ''}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
