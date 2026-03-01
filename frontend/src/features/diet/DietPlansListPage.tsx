import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { listDietPlans } from '@/api/diet';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { SkeletonCard } from '@/components/ui/SkeletonCard';
import type { DietPlan } from '@/types';

function DietPlanCard({ plan }: { plan: DietPlan }) {
  return (
    <Link to={`/diet-plans/${plan.id}`} className="block group">
      <Card padding="md" className="h-full border border-border transition-calm hover:border-primary/40 hover:shadow-md">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="truncate font-semibold text-content group-hover:text-primary transition-calm">
              {plan.name}
            </p>
            <p className="mt-0.5 text-body-sm text-content-muted">{plan.patientName}</p>
          </div>
          <Badge variant={plan.active ? 'success' : 'default'}>
            {plan.active ? 'Ativo' : 'Inativo'}
          </Badge>
        </div>

        {/* Macros resumo */}
        {plan.caloriesKcal && (
          <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-surface-muted/60 p-2.5 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-xs text-content-muted">Calorias</p>
              <p className="text-body-sm font-bold text-content">{plan.caloriesKcal}</p>
              <p className="text-xs text-content-subtle">kcal</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-content-muted">Proteínas</p>
              <p className="text-body-sm font-bold text-content">{plan.proteinG ?? '—'}</p>
              <p className="text-xs text-content-subtle">g</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-content-muted">Carbos</p>
              <p className="text-body-sm font-bold text-content">{plan.carbsG ?? '—'}</p>
              <p className="text-xs text-content-subtle">g</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-content-muted">Gordura</p>
              <p className="text-body-sm font-bold text-content">{plan.fatG ?? '—'}</p>
              <p className="text-xs text-content-subtle">g</p>
            </div>
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-content-muted">
          <span>
            📅 {new Date(plan.startDate).toLocaleDateString('pt-BR')}
            {plan.endDate && ` → ${new Date(plan.endDate).toLocaleDateString('pt-BR')}`}
          </span>
          <span>•</span>
          <span>🍽️ {plan.entriesCount} entradas</span>
          {plan.restrictions.length > 0 && (
            <>
              <span>•</span>
              <span>🚫 {plan.restrictions.slice(0, 2).join(', ')}{plan.restrictions.length > 2 ? '…' : ''}</span>
            </>
          )}
        </div>
      </Card>
    </Link>
  );
}

export function DietPlansListPage() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['diet-plans', page, search, activeFilter],
    queryFn: () =>
      listDietPlans({
        page,
        limit: 12,
        name: search || undefined,
        active: activeFilter,
      }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-content-muted">
          Gerencie os planos alimentares dos seus pacientes.
        </p>
        <Link to="/diet-plans/new">
          <Button variant="primary">+ Novo Plano de Dieta</Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="sm:max-w-xs"
        />
        <div className="flex gap-2">
          {[
            { label: 'Todos', value: undefined },
            { label: 'Ativos', value: true },
            { label: 'Inativos', value: false },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              onClick={() => { setActiveFilter(opt.value); setPage(1); }}
              className={`rounded-button px-3 py-1.5 text-body-sm font-medium transition-calm ${
                activeFilter === opt.value
                  ? 'bg-primary text-white'
                  : 'bg-surface-muted text-content-muted hover:bg-primary-subtle hover:text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !data?.data.length ? (
        <Card padding="md">
          <div className="text-center py-8">
            <span className="text-4xl">🥗</span>
            <p className="mt-3 font-medium text-content">Nenhum plano de dieta encontrado</p>
            <p className="mt-1 text-body-sm text-content-muted">
              Crie o primeiro plano para começar a acompanhar a nutrição dos pacientes.
            </p>
            <Link to="/diet-plans/new" className="mt-4 inline-block">
              <Button variant="primary">Criar Plano</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((plan) => <DietPlanCard key={plan.id} plan={plan} />)}
          </div>

          {/* Paginação */}
          {data.meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="text-body-sm text-content-muted">
                {page} / {data.meta.totalPages}
              </span>
              <Button
                variant="secondary"
                onClick={() => setPage((p) => Math.min(data.meta.totalPages, p + 1))}
                disabled={!data.meta.hasMore}
              >
                Próximo
              </Button>
            </div>
          )}
        </>
      )}

      {isLoading && (
        <div className="flex justify-center">
          <Skeleton className="h-4 w-32" />
        </div>
      )}
    </div>
  );
}
