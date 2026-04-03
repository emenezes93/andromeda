import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listPatients, exportPatientsCSV } from '@/api/patients';
import { track } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { SkeletonCardGrid } from '@/components/ui/SkeletonCard';
import { Pagination } from '@/components/ui/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { Select, type SelectOption } from '@/components/ui/Select';
import { ImportPatientsModal } from './ImportPatientsModal';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) return cpf;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

function genderLabel(gender: string | null): string {
  if (gender === 'M') return 'Masculino';
  if (gender === 'F') return 'Feminino';
  if (gender === 'Other') return 'Outro';
  if (gender === 'Prefer not to say') return 'Prefere não informar';
  return '—';
}

function genderBadgeVariant(gender: string | null): 'primary' | 'default' | 'success' {
  if (gender === 'M') return 'primary';
  if (gender === 'F') return 'success';
  return 'default';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Tamanho de página padrão para listas (M6 — benchmark p95 pode ser medido para este valor). */
const LIST_PAGE_SIZE = 25;
const DEBOUNCE_MS = 400;

const MAIN_GOAL_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todos' },
  { value: 'Emagrecimento', label: 'Emagrecimento' },
  { value: 'Ganho de massa', label: 'Ganho de massa' },
  { value: 'Performance', label: 'Performance' },
  { value: 'Melhorar saúde', label: 'Melhorar saúde' },
  { value: 'Outro', label: 'Outro' },
];

export function PatientsListPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const search = searchParams.get('search') ?? '';
  const mainGoal = searchParams.get('mainGoal') ?? '';
  const hasActivePlan = searchParams.get('hasActivePlan');
  const createdAfter = searchParams.get('createdAfter') ?? '';

  const [searchInput, setSearchInput] = useState(search);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [exporting, setExporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const setPage = useCallback(
    (p: number) => {
      const next = new URLSearchParams(searchParams);
      next.set('page', String(p));
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const updateFilters = useCallback(
    (updates: { search?: string; page?: number; mainGoal?: string; hasActivePlan?: boolean; createdAfter?: string }) => {
      const next = new URLSearchParams(searchParams);
      if (updates.search !== undefined) next.set('search', updates.search);
      if (updates.page !== undefined) next.set('page', String(updates.page));
      if (updates.mainGoal !== undefined) {
        if (updates.mainGoal) next.set('mainGoal', updates.mainGoal);
        else next.delete('mainGoal');
      }
      if (updates.hasActivePlan !== undefined) {
        if (updates.hasActivePlan === true) next.set('hasActivePlan', 'true');
        else if (updates.hasActivePlan === false) next.set('hasActivePlan', 'false');
        else next.delete('hasActivePlan');
      }
      if (updates.createdAfter !== undefined) {
        if (updates.createdAfter) next.set('createdAfter', updates.createdAfter);
        else next.delete('createdAfter');
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    const currentSearch = searchParams.get('search') ?? '';
    if (debouncedSearch !== currentSearch) {
      const next = new URLSearchParams(searchParams);
      if (debouncedSearch) next.set('search', debouncedSearch);
      else next.delete('search');
      next.set('page', '1');
      setSearchParams(next, { replace: true });
    }
  }, [debouncedSearch, searchParams, setSearchParams]);

  const loadStartTimeRef = useRef<number | null>(null);
  useEffect(() => {
    loadStartTimeRef.current = performance.now();
  }, [page, debouncedSearch, mainGoal, hasActivePlan, createdAfter]);

  const hasActivePlanBool =
    hasActivePlan === 'true' ? true : hasActivePlan === 'false' ? false : undefined;

  const { data, isLoading: loading, error: queryError, refetch } = useQuery({
    queryKey: [
      'patients',
      page,
      debouncedSearch,
      mainGoal || undefined,
      hasActivePlanBool,
      createdAfter || undefined,
    ],
    queryFn: () =>
      listPatients({
        page,
        limit: LIST_PAGE_SIZE,
        search: debouncedSearch || undefined,
        mainGoal: mainGoal || undefined,
        hasActivePlan: hasActivePlanBool,
        createdAfter: createdAfter || undefined,
      }),
  });

  useEffect(() => {
    if (!data || loadStartTimeRef.current == null) return;
    const ms = Math.round(performance.now() - loadStartTimeRef.current);
    const size = data.data?.length ?? 0;
    const total = data.meta?.total ?? 0;
    track({ name: 'list_loaded', listType: 'patients', ms, size, page });
    if (debouncedSearch.trim()) {
      track({ name: 'search_performed', listType: 'patients', success: total > 0 });
    }
    loadStartTimeRef.current = null;
  }, [data, page, debouncedSearch]);

  const error = queryError instanceof Error ? queryError.message : queryError ? 'Erro ao carregar alunos' : null;
  const fetchPatients = refetch;

  const handleExportCSV = useCallback(() => {
    setExporting(true);
    exportPatientsCSV(debouncedSearch || undefined)
      .then(() => toast.success('Export CSV iniciado.'))
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao exportar'))
      .finally(() => setExporting(false));
  }, [debouncedSearch, toast]);

  // --------------------------------------------------------------------------
  // Loading (initial / hard loading — no cached data yet)
  // --------------------------------------------------------------------------
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-64 animate-pulse rounded bg-surface-muted" />
          <div className="flex gap-2">
            <div className="h-10 w-28 animate-pulse rounded bg-surface-muted" />
            <div className="h-10 w-32 animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
        <SkeletonCardGrid count={6} />
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // Error state
  // --------------------------------------------------------------------------
  if (error && !data) {
    return (
      <div className="rounded-card border border-error bg-error-light p-5 shadow-card">
        <p className="font-medium text-error">{error}</p>
        <Button className="mt-4" onClick={() => fetchPatients()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const patients = data?.data ?? [];
  const meta = data?.meta;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-sm">
          <Input
            placeholder="Buscar por nome…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            name="search"
            aria-label="Buscar alunos"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV} loading={exporting} disabled={exporting}>
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Importar CSV
          </Button>
          <Link to="/patients/new">
            <Button>Novo aluno</Button>
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-border-muted bg-surface-muted/40 px-4 py-3">
        <Select
          options={MAIN_GOAL_OPTIONS}
          value={mainGoal}
          onChange={(e) => {
            updateFilters({ mainGoal: e.target.value, page: 1 });
          }}
          className="w-40"
          aria-label="Meta principal"
        />
        <label className="flex items-center gap-2 text-body-sm text-content">
          <input
            type="checkbox"
            checked={hasActivePlan === 'true'}
            onChange={(e) => {
              updateFilters({
                hasActivePlan: e.target.checked ? true : undefined,
                page: 1,
              });
            }}
            className="rounded border-border text-primary focus:ring-primary"
          />
          Com plano ativo
        </label>
        <label className="flex items-center gap-2 text-body-sm text-content-muted">
          Cadastrado desde
          <input
            type="date"
            value={createdAfter}
            onChange={(e) => updateFilters({ createdAfter: e.target.value || undefined, page: 1 })}
            className="rounded-input border border-border bg-surface px-2 py-1.5 text-body-sm text-content"
          />
        </label>
      </div>

      {/* Soft error banner (data already loaded but re-fetch failed) */}
      {error && data && (
        <div className="rounded-card border border-error bg-error-light px-4 py-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {/* Count label */}
      {meta && (
        <p className="text-sm text-content-muted">
          {meta.total === 0
            ? 'Nenhum aluno encontrado'
            : `${meta.total} aluno${meta.total !== 1 ? 's' : ''}`}
        </p>
      )}

      {/* Live region: announce filter/pagination changes to screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {meta
          ? `Página ${page} de ${meta.totalPages}. ${meta.total} aluno${meta.total !== 1 ? 's' : ''}.`
          : loading
            ? 'Carregando lista de alunos.'
            : ''}
      </div>

      {/* Soft loading indicator (background refresh while data is shown) */}
      {loading && data && (
        <div className="flex justify-center py-2">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {/* Empty state */}
      {!loading && patients.length === 0 && (
        <EmptyState
          title={
            debouncedSearch
              ? `Nenhum aluno encontrado para "${debouncedSearch}".`
              : 'Nenhum aluno cadastrado ainda.'
          }
          action={
            !debouncedSearch ? (
              <Link to="/patients/new">
                <Button>Novo aluno</Button>
              </Link>
            ) : undefined
          }
        />
      )}

      {/* Patient grid */}
      {patients.length > 0 && (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {patients.map((patient) => (
              <li key={patient.id}>
                <Link to={`/patients/${patient.id}`} className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-card">
                  <Card className="h-full transition-shadow hover:shadow-card-hover" padding="md">
                    {/* Name + gender badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-content leading-snug break-words flex-1">
                        {patient.fullName}
                      </h3>
                      {patient.gender && (
                        <Badge variant={genderBadgeVariant(patient.gender)} className="shrink-0">
                          {genderLabel(patient.gender)}
                        </Badge>
                      )}
                    </div>

                    {/* CPF */}
                    <p className="mt-2 text-sm text-content-muted">
                      <span className="font-medium text-content-subtle">CPF:</span>{' '}
                      {patient.cpf ? maskCpf(patient.cpf) : '—'}
                    </p>

                    {/* Email */}
                    <p className="mt-1 text-sm text-content-muted truncate">
                      <span className="font-medium text-content-subtle">E-mail:</span>{' '}
                      {patient.email ?? '—'}
                    </p>

                    {/* Session / evolution counters */}
                    <div className="mt-3 flex gap-3 border-t border-border pt-3">
                      <span className="inline-flex items-center gap-1 rounded-button bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary">
                        {patient._count?.sessions ?? 0} avaliação(ões)
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-button bg-surface-muted px-2 py-0.5 text-xs font-medium text-content-muted">
                        {patient._count?.evolutions ?? 0} evolução(ões)
                      </span>
                    </div>
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
            label="lista de alunos"
          />
        </>
      )}

      <ImportPatientsModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={() => {
          refetch();
          setImportOpen(false);
        }}
      />
    </div>
  );
}
