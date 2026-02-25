import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUsageSummary } from '@/api/quota';
import type { PlanUsageSummary } from '@/types';
import { Card } from './Card';
import { QuotaUsageBar } from './QuotaUsageBar';
import { Badge } from './Badge';

const PLAN_LABELS: Record<string, string> = {
  free: 'Gratuito',
  solo: 'Solo',
  clinic: 'Clínica',
  pro: 'Pro',
};

export function PlanUsageCard() {
  const [usage, setUsage] = useState<PlanUsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUsageSummary()
      .then(setUsage)
      .catch(() => setUsage(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card padding="md">
        <div className="h-20 animate-pulse rounded-lg bg-surface-muted" />
      </Card>
    );
  }

  if (!usage) return null;

  const planLabel = PLAN_LABELS[usage.planTier] ?? usage.planTier;
  const isFree = usage.planTier === 'free';
  const patientsAtLimit =
    usage.patients.max !== null && usage.patients.current >= usage.patients.max;
  const sessionsAtLimit =
    usage.sessionsThisMonth.max !== null &&
    usage.sessionsThisMonth.current >= usage.sessionsThisMonth.max;
  const showUpgradeCta = isFree && (patientsAtLimit || sessionsAtLimit || !usage.aiInsightsEnabled);

  return (
    <Card padding="md">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-body font-semibold text-content">Uso do plano</h3>
          <Badge variant={isFree ? 'default' : 'primary'}>{planLabel}</Badge>
          {usage.aiInsightsEnabled && (
            <Badge variant="success">IA Ativada</Badge>
          )}
          {!usage.aiInsightsEnabled && (
            <Badge variant="warning">IA Indisponível</Badge>
          )}
        </div>

        <div className="space-y-3">
          <QuotaUsageBar
            label="Pacientes"
            current={usage.patients.current}
            max={usage.patients.max}
          />
          <QuotaUsageBar
            label="Sessões este mês"
            current={usage.sessionsThisMonth.current}
            max={usage.sessionsThisMonth.max}
          />
        </div>

        {showUpgradeCta && (
          <div className="flex items-center justify-between rounded-lg bg-primary-subtle/40 px-3 py-2.5">
            <p className="text-body-sm text-content">
              Atualize seu plano para remover limites.
            </p>
            <Link
              to="/subscription"
              className="shrink-0 rounded-button bg-primary px-3 py-1.5 text-body-sm font-medium text-white transition-calm hover:bg-primary-hover"
            >
              Upgrade →
            </Link>
          </div>
        )}
      </div>
    </Card>
  );
}
