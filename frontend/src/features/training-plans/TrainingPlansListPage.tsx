import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { listTrainingPlans } from '@/api/training-plans';
import type { TrainingPlanListResponse } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCardGrid } from '@/components/ui/SkeletonCard';

const LIMIT = 12;
const DEBOUNCE_MS = 400;

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function TrainingPlansListPage() {
  const [searchParams] = useSearchParams();
  const patientIdFilter = searchParams.get('patientId') ?? undefined;

  const [data, setData] = useState<TrainingPlanListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchPlans = useCallback(() => {
    setLoading(true);
    setError(null);
    listTrainingPlans({
      page,
      limit: LIMIT,
      patientId: patientIdFilter,
      active: activeFilter,
      name: debouncedSearch || undefined,
    })
      .then((res) => setData(res))
      .catch((err) =>
        setError(err instanceof Error ? err.message : 'Erro ao carregar planos de treino')
      )
      .finally(() => setLoading(false));
  }, [page, patientIdFilter, activeFilter, debouncedSearch]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-64 animate-pulse rounded bg-surface-muted" />
          <div className="h-10 w-32 animate-pulse rounded bg-surface-muted" />
        </div>
        <SkeletonCardGrid count={6} />
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="rounded-card border border-error bg-error-light p-5 shadow-card">
        <p className="font-medium text-error">{error}</p>
        <Button className="mt-4" onClick={fetchPlans}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const plans = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap gap-3">
          <div className="w-full max-w-sm">
            <Input
              placeholder="Buscar por nome do plano…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              name="search"
              aria-label="Buscar planos de treino"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveFilter(undefined)}
              className={`rounded-button px-3 py-1.5 text-body-sm font-medium transition-calm ${
                activeFilter === undefined
                  ? 'bg-primary text-white'
                  : 'border border-border text-content-muted hover:bg-surface-muted'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setActiveFilter(true)}
              className={`rounded-button px-3 py-1.5 text-body-sm font-medium transition-calm ${
                activeFilter === true
                  ? 'bg-primary text-white'
                  : 'border border-border text-content-muted hover:bg-surface-muted'
              }`}
            >
              Ativos
            </button>
            <button
              onClick={() => { setActiveFilter(false); setPage(1); }}
              className={`rounded-button px-3 py-1.5 text-body-sm font-medium transition-calm ${
                activeFilter === false
                  ? 'bg-primary text-white'
                  : 'border border-border text-content-muted hover:bg-surface-muted'
              }`}
            >
              Inativos
            </button>
          </div>
        </div>
        <Link to="/training-plans/new">
          <Button>Novo plano</Button>
        </Link>
      </div>

      {patientIdFilter && (
        <div className="rounded-card border border-primary/30 bg-primary-subtle/30 px-4 py-2.5">
          <p className="text-body-sm text-content">
            Filtrando planos do aluno selecionado.{' '}
            <Link to="/training-plans" className="font-medium text-primary hover:underline">
              Ver todos
            </Link>
          </p>
        </div>
      )}

      {error && data && (
        <div className="rounded-card border border-error bg-error-light px-4 py-3">
          <p className="text-sm text-error">{error}</p>
        </div>
      )}

      {meta && (
        <p className="text-sm text-content-muted">
          {meta.total === 0
            ? 'Nenhum plano encontrado'
            : `${meta.total} plano${meta.total !== 1 ? 's' : ''}`}
        </p>
      )}

      {loading && data && (
        <div className="flex justify-center py-2">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      )}

      {!loading && plans.length === 0 && (
        <Card>
          <p className="text-content-muted">
            {debouncedSearch
              ? `Nenhum plano encontrado para "${debouncedSearch}".`
              : 'Ainda não há planos de treino. Crie um para começar a acompanhar a evolução.'}
          </p>
          {!debouncedSearch && (
            <Link to="/training-plans/new">
              <Button className="mt-4">Novo plano</Button>
            </Link>
          )}
        </Card>
      )}


      {plans.length > 0 && (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <li key={plan.id}>
                <Link
                  to={`/training-plans/${plan.id}`}
                  className="block h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-card"
                >
                  <Card className="h-full transition-shadow hover:shadow-card-hover" padding="md">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-content leading-snug break-words flex-1">
                        {plan.name}
                      </h3>
                      <Badge variant={plan.active ? 'success' : 'default'} className="shrink-0">
                        {plan.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>

                    <p className="mt-2 text-sm text-content-muted">
                      <span className="font-medium text-content-subtle">Aluno:</span>{' '}
                      {plan.patientName}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2 text-sm text-content-muted">
                      <span>
                        <span className="font-medium text-content-subtle">Início:</span>{' '}
                        {formatDate(plan.startDate)}
                      </span>
                      {plan.endDate && (
                        <span>
                          <span className="font-medium text-content-subtle">Fim:</span>{' '}
                          {formatDate(plan.endDate)}
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex gap-3 border-t border-border pt-3">
                      <span className="inline-flex items-center gap-1 rounded-button bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary">
                        {plan.executionsCount} treino(s) realizado(s)
                      </span>
                    </div>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="secondary"
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
                disabled={page >= meta.totalPages || loading}
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
