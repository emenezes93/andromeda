import { useState, useEffect } from 'react';
import { listAudit } from '@/api/audit';
import type { AuditLog } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const ACTION_OPTIONS = ['create', 'update', 'delete', 'login', 'logout', 'register'];
const ENTITY_OPTIONS = ['tenant', 'user', 'template', 'session', 'insight', 'patient', 'patient_evolution'];

export function AuditListPage() {
  const [data, setData] = useState<{
    data: AuditLog[];
    meta: { page: number; totalPages: number; total: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    setError(null);
    listAudit({
      page,
      limit,
      action: filterAction || undefined,
      entity: filterEntity || undefined,
      from: filterFrom ? new Date(filterFrom).toISOString() : undefined,
      to: filterTo ? new Date(filterTo + 'T23:59:59').toISOString() : undefined,
    })
      .then((res) => setData(res))
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [page, filterAction, filterEntity, filterFrom, filterTo]);

  const hasFilters = filterAction !== '' || filterEntity !== '' || filterFrom !== '' || filterTo !== '';

  const clearFilters = () => {
    setFilterAction('');
    setFilterEntity('');
    setFilterFrom('');
    setFilterTo('');
    setPage(1);
  };

  // Reset to page 1 when filters change
  const handleFilterChange = (setter: (v: string) => void) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setPage(1);
    setter(e.target.value);
  };

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

  const logs = data?.data ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-wrap items-end gap-3 rounded-card border border-border bg-surface p-4">
        <div className="flex flex-col gap-1">
          <label className="text-body-sm font-medium text-content-muted">Ação</label>
          <select
            className="rounded-button border border-border bg-surface px-3 py-2 text-body-sm text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={filterAction}
            onChange={handleFilterChange(setFilterAction)}
          >
            <option value="">Todas</option>
            {ACTION_OPTIONS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-body-sm font-medium text-content-muted">Entidade</label>
          <select
            className="rounded-button border border-border bg-surface px-3 py-2 text-body-sm text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={filterEntity}
            onChange={handleFilterChange(setFilterEntity)}
          >
            <option value="">Todas</option>
            {ENTITY_OPTIONS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-body-sm font-medium text-content-muted">De</label>
          <input
            type="date"
            className="rounded-button border border-border bg-surface px-3 py-2 text-body-sm text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={filterFrom}
            onChange={handleFilterChange(setFilterFrom)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-body-sm font-medium text-content-muted">Até</label>
          <input
            type="date"
            className="rounded-button border border-border bg-surface px-3 py-2 text-body-sm text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={filterTo}
            onChange={handleFilterChange(setFilterTo)}
          />
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpar filtros
          </Button>
        )}
        <p className="ml-auto text-body-sm text-content-muted">
          {meta?.total ?? 0} registro(s)
        </p>
      </div>

      {logs.length === 0 ? (
        <Card>
          <p className="text-content-muted">
            {hasFilters ? 'Nenhum registro para os filtros selecionados.' : 'Nenhum registro de auditoria.'}
          </p>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-surface-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-content-muted">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-content-muted">Ação</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-content-muted">Entidade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-content-muted">ID da entidade</th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase text-content-muted">Ator</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-muted/50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-content-muted">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-content">{log.action}</td>
                    <td className="px-4 py-3 text-sm text-content-muted">{log.entity}</td>
                    <td className="px-4 py-3 font-mono text-xs text-content-subtle">
                      {log.entityId ? (
                        <span title={log.entityId}>{log.entityId.slice(0, 8)}…</span>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-content-muted">
                      {log.actorUserId ? (
                        <span title={log.actorUserId}>{log.actorUserId.slice(0, 8)}…</span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-content-muted">
                Página {page} de {meta.totalPages}
              </span>
              <Button variant="secondary" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
