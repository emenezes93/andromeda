import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listSessions } from '@/api/sessions';
import { listTemplates } from '@/api/templates';
import type { Session, Template } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SessionStatusBadge } from '@/components/ui/SessionStatusBadge';
import { SkeletonTable } from '@/components/ui/SkeletonCard';

const STATUS_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluídas' },
];

export function SessionsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId') ?? '';
  const [data, setData] = useState<{
    data: Session[];
    meta: { page: number; totalPages: number; total: number };
  } | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');
  const limit = 10;

  useEffect(() => {
    listTemplates({ page: 1, limit: 100 })
      .then((res) => setTemplates(res.data))
      .catch(() => setTemplates([]));
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    listSessions({
      page,
      limit,
      status: statusFilter || undefined,
      templateId: templateFilter || undefined,
      patientId: patientIdFromUrl || undefined,
    })
      .then((res) => setData(res))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [page, statusFilter, templateFilter, patientIdFromUrl]);

  const sessions = data?.data ?? [];
  const hasFilter = statusFilter !== '' || templateFilter !== '' || patientIdFromUrl !== '';

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-6 w-48 animate-pulse rounded bg-surface-muted" />
          <div className="flex gap-2">
            <div className="h-10 w-32 animate-pulse rounded bg-surface-muted" />
            <div className="h-10 w-40 animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
        <SkeletonTable rows={8} />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-error bg-error-light">
        <p className="text-error">{error}</p>
        <Button className="mt-4" onClick={() => setPage(1)}>
          Tentar novamente
        </Button>
      </Card>
    );
  }

  const meta = data?.meta;

  const clearFilters = () => {
    setStatusFilter('');
    setTemplateFilter('');
    setPage(1);
    if (patientIdFromUrl) {
      const next = new URLSearchParams(searchParams);
      next.delete('patientId');
      setSearchParams(next);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-content-muted">
            {meta?.total ?? 0} sessão(ões)
          </p>
          <select
            className="rounded-button border border-border bg-surface px-3 py-2 text-body-sm text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            aria-label="Filtrar por status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-button border border-border bg-surface px-3 py-2 text-body-sm text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary min-w-[140px]"
            value={templateFilter}
            onChange={(e) => { setTemplateFilter(e.target.value); setPage(1); }}
            aria-label="Filtrar por template"
          >
            <option value="">Todos os templates</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          {hasFilter && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
        <Link to="/sessions/new">
          <Button>Nova sessão</Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <p className="text-content-muted">
            {hasFilter
              ? 'Nenhuma sessão para os filtros selecionados.'
              : 'Nenhuma sessão ainda. Inicie uma nova.'}
          </p>
          {!hasFilter && (
            <Link to="/sessions/new">
              <Button className="mt-4">Nova sessão</Button>
            </Link>
          )}
        </Card>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link to={`/sessions/${s.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-content">
                        {s.template?.name ?? 'Template'}
                      </h3>
                      {s.status && <SessionStatusBadge status={s.status} />}
                    </div>
                    {s.patient && (
                      <p className="mt-1 text-body-sm text-primary font-medium">
                        {(s.patient as { fullName?: string }).fullName}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-content-muted">
                      {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="mt-1 text-xs text-content-subtle">ID: {s.id.slice(0, 8)}…</p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-sm text-content-muted">
                Página {page} de {meta.totalPages}
              </span>
              <Button
                variant="secondary"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
