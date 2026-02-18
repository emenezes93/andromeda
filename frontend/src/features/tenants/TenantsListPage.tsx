import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { listTenants, updateTenant } from '@/api/tenants';
import { getStoredUser } from '@/stores/authStore';
import type { Tenant } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativo',
  suspended: 'Suspenso',
};

export function TenantsListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = getStoredUser();

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 1, hasMore: false });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTenants = useCallback((page = 1) => {
    setLoading(true);
    setError(null);
    listTenants({ page, limit: 20 })
      .then((res) => {
        setTenants(res.data);
        setMeta(res.meta);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar tenants.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (user?.role !== 'owner') {
      navigate('/', { replace: true });
      return;
    }
    fetchTenants();
  }, [user?.role, navigate, fetchTenants]);

  const handleStatusChange = useCallback(
    async (tenant: Tenant, newStatus: 'active' | 'suspended') => {
      if (newStatus === tenant.status) return;
      setUpdatingId(tenant.id);
      try {
        const updated = await updateTenant(tenant.id, { status: newStatus });
        setTenants((prev) => prev.map((t) => (t.id === tenant.id ? updated : t)));
        toast.success(`Status de "${tenant.name}" alterado para ${STATUS_LABELS[newStatus]}.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao atualizar status.');
      } finally {
        setUpdatingId(null);
      }
    },
    [toast],
  );

  if (user?.role !== 'owner') {
    return null;
  }

  if (loading && tenants.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-8 w-32 animate-pulse rounded-button bg-surface-muted" />
          <div className="h-10 w-28 animate-pulse rounded-button bg-surface-muted" />
        </div>
        <Card padding="none">
          <div className="divide-y divide-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="h-4 w-48 animate-pulse rounded bg-surface-muted" />
                <div className="h-6 w-20 animate-pulse rounded-full bg-surface-muted" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (error && tenants.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-heading font-semibold text-content">Tenants</h1>
          <Link to="/tenants/new">
            <Button>Novo tenant</Button>
          </Link>
        </div>
        <Card className="border-error bg-error-light">
          <p className="text-error">{error}</p>
          <Button className="mt-4" onClick={() => fetchTenants()}>
            Tentar novamente
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading font-semibold text-content">Tenants</h1>
          <p className="mt-0.5 text-body-sm text-content-muted">
            {meta.total} {meta.total === 1 ? 'tenant' : 'tenants'} no total
          </p>
        </div>
        <Link to="/tenants/new">
          <Button variant="tactile">Novo tenant</Button>
        </Link>
      </div>

      {tenants.length === 0 ? (
        <Card>
          <p className="text-content-muted">Nenhum tenant cadastrado.</p>
          <div className="mt-4">
            <Link to="/tenants/new">
              <Button variant="outline" size="sm">
                Criar o primeiro tenant
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px]" role="table">
              <thead>
                <tr className="border-b border-border bg-surface-muted/50">
                  <th className="px-5 py-3 text-left text-body-sm font-medium text-content-muted">
                    Nome
                  </th>
                  <th className="px-5 py-3 text-left text-body-sm font-medium text-content-muted">
                    Status
                  </th>
                  <th className="px-5 py-3 text-left text-body-sm font-medium text-content-muted">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tenants.map((t) => (
                  <tr key={t.id} className="transition-calm hover:bg-surface-muted/30">
                    <td className="px-5 py-3">
                      <span className="font-medium text-content">{t.name}</span>
                    </td>
                    <td className="px-5 py-3">
                      <select
                        className="rounded-button border border-border bg-surface px-2 py-1.5 text-body-sm text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                        value={t.status}
                        disabled={updatingId === t.id}
                        onChange={(e) =>
                          void handleStatusChange(t, e.target.value as 'active' | 'suspended')
                        }
                        aria-label={`Alterar status de ${t.name}`}
                      >
                        <option value="active">{STATUS_LABELS.active}</option>
                        <option value="suspended">{STATUS_LABELS.suspended}</option>
                      </select>
                      {updatingId === t.id && (
                        <span className="ml-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      )}
                    </td>
                    <td className="px-5 py-3 text-body-sm text-content-muted">
                      {new Date(t.createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-5 py-3">
              <p className="text-body-sm text-content-muted">
                Página {meta.page} de {meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={meta.page <= 1}
                  onClick={() => fetchTenants(meta.page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta.hasMore}
                  onClick={() => fetchTenants(meta.page + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
