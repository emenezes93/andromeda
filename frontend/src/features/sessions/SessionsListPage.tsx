import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { listSessions } from '@/api/sessions';
import type { Session } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function SessionsListPage() {
  const [data, setData] = useState<{
    data: Session[];
    meta: { page: number; totalPages: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    setError(null);
    listSessions({ page, limit })
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
      <Card className="border-red-200 bg-red-50">
        <p className="text-red-700">{error}</p>
        <Button className="mt-4" onClick={() => setPage(1)}>
          Tentar novamente
        </Button>
      </Card>
    );
  }

  const sessions = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-slate-600">{meta ? `${meta.total} sessão(ões)` : 'Nenhuma sessão'}</p>
        <Link to="/sessions/new">
          <Button>Nova sessão</Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <p className="text-slate-600">Nenhuma sessão ainda. Inicie uma nova.</p>
          <Link to="/sessions/new">
            <Button className="mt-4">Nova sessão</Button>
          </Link>
        </Card>
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {sessions.map((s) => (
              <li key={s.id}>
                <Link to={`/sessions/${s.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <h3 className="font-semibold text-slate-900">
                      {(s.template as { name?: string })?.name ?? 'Template'}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">ID: {s.id.slice(0, 8)}…</p>
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
              <span className="text-sm text-slate-600">
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
