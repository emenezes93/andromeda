import { useState, useEffect } from 'react';
import { getAiUsage } from '@/api/ai';
import type { AiUsageMetrics } from '@/api/ai';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const PERIOD_OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
] as const;

export function AiUsagePage() {
  const [metrics, setMetrics] = useState<AiUsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState<number>(30);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const to = new Date();
    const from = new Date(to.getTime() - periodDays * 24 * 60 * 60 * 1000);

    getAiUsage({
      from: from.toISOString(),
      to: to.toISOString(),
    })
      .then((data) => {
        if (!cancelled) setMetrics(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Erro ao carregar');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [periodDays]);

  if (loading && !metrics) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <Card>
        <p className="text-error">{error}</p>
        <Button className="mt-4" onClick={() => setPeriodDays(30)}>
          Tentar novamente
        </Button>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <p className="text-content-muted">Nenhuma métrica disponível.</p>
      </Card>
    );
  }

  const { totals, records } = metrics;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading font-semibold text-content">Uso de IA</h1>
          <p className="mt-1 text-body-sm text-content-muted">
            Métricas de uso do LLM e custos estimados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="period" className="text-body-sm text-content-muted">
            Período:
          </label>
          <select
            id="period"
            className="rounded-button border border-border bg-surface px-3 py-1.5 text-body-sm text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card padding="md" className="border-l-4 border-l-primary">
          <p className="text-body-sm font-medium text-content-muted">Total de Tokens (Entrada)</p>
          <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">
            {totals.totalInputTokens.toLocaleString('pt-BR')}
          </p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-primary">
          <p className="text-body-sm font-medium text-content-muted">Total de Tokens (Saída)</p>
          <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">
            {totals.totalOutputTokens.toLocaleString('pt-BR')}
          </p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-primary">
          <p className="text-body-sm font-medium text-content-muted">Custo Estimado</p>
          <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">
            ${totals.totalCostUsd.toFixed(4)}
          </p>
        </Card>
      </div>

      {/* Records Table */}
      <Card title="Registros de Uso" padding="none">
        {records.length === 0 ? (
          <p className="px-5 py-8 text-body text-content-muted">
            Nenhum registro de uso no período.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b border-border-muted bg-surface-muted">
                  <th className="px-4 py-3 font-medium text-content-muted">Data</th>
                  <th className="px-4 py-3 font-medium text-content-muted">Provedor</th>
                  <th className="px-4 py-3 font-medium text-content-muted">Modelo</th>
                  <th className="px-4 py-3 font-medium text-content-muted text-right">
                    Tokens (Entrada)
                  </th>
                  <th className="px-4 py-3 font-medium text-content-muted text-right">
                    Tokens (Saída)
                  </th>
                  <th className="px-4 py-3 font-medium text-content-muted text-right">Custo</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border-muted transition-calm hover:bg-surface-muted"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                      {new Date(r.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-button bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary">
                        {r.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-content-subtle text-xs">
                      {r.model}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-content-muted">
                      {r.inputTokens.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-content-muted">
                      {r.outputTokens.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-content">
                      ${r.estimatedCostUsd.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
