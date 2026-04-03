import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTenant, updateTenant } from '@/api/tenants';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

export function NotificationsSettingsPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(false);
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    const id = localStorage.getItem('tenantId');
    if (!id) {
      setLoading(false);
      return;
    }
    setTenantId(id);
    getTenant(id)
      .then((t) => setEmailAlertsEnabled(t.emailAlertsEnabled ?? false))
      .catch(() => toast.error('Não foi possível carregar as configurações.'))
      .finally(() => setLoading(false));
  }, [toast]);

  const handleToggleEmailAlerts = async (checked: boolean) => {
    if (!tenantId) return;
    setSaving(true);
    const previous = emailAlertsEnabled;
    setEmailAlertsEnabled(checked);
    try {
      await updateTenant(tenantId, { emailAlertsEnabled: checked });
      toast.success(
        checked
          ? 'Resumo de alertas por email ativado.'
          : 'Resumo de alertas por email desativado.'
      );
    } catch (err) {
      setEmailAlertsEnabled(previous);
      toast.error(
        err instanceof Error ? err.message : 'Não foi possível alterar. Apenas proprietários podem editar.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
        <h1 className="text-heading font-semibold text-content">Notificações</h1>
        <Card title="Alertas por email" padding="md">
          <p className="text-body-sm text-content-muted">
            Selecione uma organização para configurar as notificações.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-6">
      <h1 className="text-heading font-semibold text-content">Notificações</h1>
      <p className="text-body text-content-muted">
        Configure onde e como você recebe alertas da plataforma (alunos inativos, metas, aderência, etc.).
      </p>

      {/* Onde ver alertas */}
      <Card title="Onde ver seus alertas" padding="md">
        <p className="text-body-sm text-content-muted mb-4">
          O ícone de <strong className="text-content">sino</strong> abre seus alertas. No desktop, ele fica no rodapé da barra lateral. No mobile, ele aparece no topo e também dentro do menu lateral.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-button bg-primary-subtle px-4 py-2.5 text-body-sm font-medium text-primary transition-calm hover:bg-primary/10"
        >
          Ir ao dashboard
        </Link>
      </Card>

      {/* Email */}
      <Card title="Resumo por email" padding="md">
        <p className="text-body-sm text-content-muted mb-4">
          Receba um resumo diário por email com os alertas não lidos da organização (alunos inativos, metas, queda de aderência). O envio ocorre após a geração dos alertas (por volta das 08:00).
        </p>
        <label className="flex cursor-pointer items-start gap-4 rounded-button border border-border p-4 transition-calm hover:bg-surface-muted/50">
          <input
            type="checkbox"
            checked={emailAlertsEnabled}
            disabled={saving}
            onChange={(e) => void handleToggleEmailAlerts(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-describedby="email-alerts-desc"
          />
          <div id="email-alerts-desc">
            <span className="text-body font-medium text-content">
              Ativar resumo de alertas por email
            </span>
            <p className="mt-1 text-body-sm text-content-muted">
              {emailAlertsEnabled ? 'Você receberá um email diário com os alertas.' : 'Ative para receber um resumo por email.'}
            </p>
          </div>
        </label>
        {saving && (
          <p className="mt-2 text-body-xs text-content-subtle">Salvando…</p>
        )}
      </Card>
    </div>
  );
}
