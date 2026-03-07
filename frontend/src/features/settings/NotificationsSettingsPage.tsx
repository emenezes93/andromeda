import { useState, useEffect } from 'react';
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
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="space-y-6">
        <h2 className="text-heading font-semibold text-content">Notificações</h2>
        <Card title="Alertas por email" padding="md">
          <p className="text-body-sm text-content-muted">
            Selecione uma organização para configurar as notificações.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-heading font-semibold text-content">Notificações</h2>

      <Card title="Alertas por email" padding="md">
        <p className="text-body-sm text-content-muted mb-4">
          Receba um resumo diário por email com os alertas não lidos da organização (por exemplo,
          pacientes inativos, queda de aderência). O envio ocorre após a geração dos alertas (por
          volta das 08:00).
        </p>
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={emailAlertsEnabled}
            disabled={saving}
            onChange={(e) => void handleToggleEmailAlerts(e.target.checked)}
            className="h-4 w-4 rounded border-border text-primary focus:ring-2 focus:ring-primary"
          />
          <span className="text-body-sm font-medium text-content">
            Ativar resumo de alertas por email
          </span>
        </label>
      </Card>
    </div>
  );
}
