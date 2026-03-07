import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listSessions } from '@/api/sessions';
import { listTemplates } from '@/api/templates';
import { track } from '@/lib/analytics';
import type { Session, Template } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SessionStatusBadge } from '@/components/ui/SessionStatusBadge';
import { SkeletonTable } from '@/components/ui/SkeletonCard';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';

const STATUS_OPTIONS = [
  { value: '', label: 'Todas' },
  { value: 'in_progress', label: 'Em andamento' },
  { value: 'completed', label: 'Concluídas' },
];

const LIST_PAGE_SIZE = 25;

export function SessionsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const patientIdFromUrl = searchParams.get('patientId') ?? '';
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [templateFilter, setTemplateFilter] = useState('');
  const limit = LIST_PAGE_SIZE;

  const { data: templatesData } = useQuery({
    queryKey: ['templates-select'],
    queryFn: () => listTemplates({ page: 1, limit: 100 }),
  });
  const templates: Template[] = templatesData?.data ?? [];

  const loadStartTimeRef = useRef<number | null>(null);
  useEffect(() => {
    loadStartTimeRef.current = performance.now();
  }, [page, statusFilter, templateFilter, patientIdFromUrl]);

  const { data, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: ['sessions', page, statusFilter, templateFilter, patientIdFromUrl],
    queryFn: () =>
      listSessions({
        page,
        limit,
        status: statusFilter || undefined,
        templateId: templateFilter || undefined,
        patientId: patientIdFromUrl || undefined,
      }),
  });

  const sessions: Session[] = data?.data ?? [];
  const hasFilter = statusFilter !== '' || templateFilter !== '' || patientIdFromUrl !== '';
  const error = queryError instanceof Error ? queryError.message : null;

  useEffect(() => {
    if (!data || loadStartTimeRef.current == null) return;
    const ms = Math.round(performance.now() - loadStartTimeRef.current);
    const size = data.data?.length ?? 0;
    track({ name: 'list_loaded', listType: 'sessions', ms, size, page });
    loadStartTimeRef.current = null;
  }, [data, page]);

  const getActiveFilterCount = (status: string, template: string) =>
    [status, template, patientIdFromUrl].filter(Boolean).length;

  const trackFilterApplied = (filterType: string, newStatus?: string, newTemplate?: string) => {
    const count = getActiveFilterCount(newStatus ?? statusFilter, newTemplate ?? templateFilter);
    track({ name: 'filter_applied', listType: 'sessions', filterType, count });
  };

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

  if (error && !data) {
    return (
      <Card className="border-error bg-error-light">
        <p className="text-error">{error}</p>
        <Button className="mt-4" onClick={() => refetch()}>
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
            {meta?.total ?? 0} avaliação(ões)
          </p>
          <select
            className="rounded-button border border-border bg-surface px-3 py-2 text-body-sm text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={statusFilter}
            onChange={(e) => {
              const v = e.target.value;
              setStatusFilter(v);
              setPage(1);
              trackFilterApplied('status', v, templateFilter);
            }}
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
            onChange={(e) => {
              const v = e.target.value;
              setTemplateFilter(v);
              setPage(1);
              trackFilterApplied('template', statusFilter, v);
            }}
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
          <Button>Nova avaliação</Button>
        </Link>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {meta
          ? `Página ${page} de ${meta.totalPages}. ${meta.total} avaliação(ões).`
          : loading
            ? 'Carregando lista de avaliações.'
            : ''}
      </div>

      {sessions.length === 0 ? (
        <EmptyState
          title={
            hasFilter
              ? 'Nenhuma avaliação para os filtros selecionados.'
              : 'Nenhuma avaliação ainda. Que tal iniciar a primeira?'
          }
          action={
            !hasFilter ? (
              <Link to="/sessions/new">
                <Button>Nova avaliação</Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link to={`/sessions/${s.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-card-hover">
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

          <Pagination
            page={page}
            totalPages={meta?.totalPages ?? 1}
            onPageChange={setPage}
            loading={loading}
            label="lista de avaliações"
          />
        </>
      )}
    </div>
  );
}
