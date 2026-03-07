import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listTemplates } from '@/api/templates';
import type { Template } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { SkeletonCardGrid } from '@/components/ui/SkeletonCard';
import { Pagination } from '@/components/ui/Pagination';

export function TemplatesListPage() {
  const [data, setData] = useState<{
    data: Template[];
    meta: { page: number; totalPages: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 25;

  useEffect(() => {
    setLoading(true);
    setError(null);
    listTemplates({ page, limit })
      .then((res) => setData(res))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [page]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-6 w-32 animate-pulse rounded bg-surface-muted" />
          <div className="h-10 w-32 animate-pulse rounded bg-surface-muted" />
        </div>
        <SkeletonCardGrid count={6} />
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

  const templates = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-content-muted">{meta ? `${meta.total} template(s)` : 'Nenhum template'}</p>
        <Link to="/templates/new">
          <Button>Novo template</Button>
        </Link>
      </div>

      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {meta
          ? `Página ${page} de ${meta.totalPages}. ${meta.total} template(s).`
          : loading
            ? 'Carregando lista de templates.'
            : ''}
      </div>

      {templates.length === 0 ? (
        <Card>
          <p className="text-content-muted">Nenhum template ainda. Crie o primeiro.</p>
          <Link to="/templates/new">
            <Button className="mt-4">Novo template</Button>
          </Link>
        </Card>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((t) => (
              <li key={t.id}>
                <Card className="h-full transition-shadow hover:shadow-card-hover">
                  <Link to={`/templates/${t.id}`} className="block">
                    <h3 className="font-semibold text-content">{t.name}</h3>
                    <p className="mt-1 text-sm text-content-muted">
                      {(t.schemaJson as { questions?: unknown[] })?.questions?.length ?? 0}{' '}
                      pergunta(s)
                    </p>
                    <p className="mt-1 text-xs text-content-subtle">
                      {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </Link>
                  <div className="mt-3 flex gap-2 border-t border-border-muted pt-3">
                    <Link to={`/templates/${t.id}`} className="flex-1">
                      <Button variant="ghost" size="sm" className="w-full">
                        Ver
                      </Button>
                    </Link>
                    <Link to={`/templates/${t.id}/report`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        Relatório
                      </Button>
                    </Link>
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <Pagination
            page={page}
            totalPages={meta?.totalPages ?? 1}
            onPageChange={setPage}
            loading={loading}
            label="lista de templates"
          />
        </>
      )}
    </div>
  );
}
