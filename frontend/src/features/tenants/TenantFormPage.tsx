import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTenant } from '@/api/tenants';
import { getStoredUser } from '@/stores/authStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export function TenantFormPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const user = getStoredUser();

  const [name, setName] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [nameError, setNameError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'owner') {
      navigate('/', { replace: true });
      return;
    }
  }, [user?.role, navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setApiError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Nome é obrigatório.');
      return;
    }
    setNameError(null);
    setSubmitting(true);
    try {
      await createTenant({ name: trimmed, status });
      toast.success('Tenant criado com sucesso.');
      navigate('/tenants');
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Erro ao criar tenant.');
    } finally {
      setSubmitting(false);
    }
  }

  if (user?.role !== 'owner') {
    return null;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-heading font-semibold text-content">Novo tenant</h1>
        <p className="mt-1 text-body-sm text-content-muted">
          Cadastre um novo tenant (organização/clínica) na plataforma.
        </p>
      </div>

      <Card>
        <form onSubmit={(e) => void handleSubmit(e)} noValidate className="space-y-5">
          <Input
            label="Nome *"
            type="text"
            name="name"
            id="name"
            autoComplete="off"
            placeholder="Ex.: Clínica Exemplo"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (nameError) setNameError(null);
              if (apiError) setApiError(null);
            }}
            error={nameError ?? undefined}
            disabled={submitting}
          />

          <div className="w-full">
            <label
              htmlFor="status"
              className="mb-1.5 block text-body-sm font-medium text-content-muted"
            >
              Status
            </label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'suspended')}
              disabled={submitting}
              className="min-h-touch w-full rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
            >
              <option value="active">Ativo</option>
              <option value="suspended">Suspenso</option>
            </select>
          </div>

          {apiError && (
            <div
              className="rounded-button border border-error bg-error-light px-3 py-2.5 text-body-sm text-error"
              role="alert"
            >
              {apiError}
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => navigate('/tenants')}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="tactile" loading={submitting}>
              Criar tenant
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
