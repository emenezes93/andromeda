import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listTemplates } from '@/api/templates';
import type { Template } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function TemplatesListPage() {
  const [data, setData] = useState<{
    data: Template[];
    meta: { page: number; totalPages: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

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
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
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
                <Link to={`/templates/${t.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <h3 className="font-semibold text-content">{t.name}</h3>
                    <p className="mt-1 text-sm text-content-muted">
                      {(t.schemaJson as { questions?: unknown[] })?.questions?.length ?? 0}{' '}
                      pergunta(s)
                    </p>
                    <p className="mt-1 text-xs text-content-subtle">
                      {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                    </p>
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
