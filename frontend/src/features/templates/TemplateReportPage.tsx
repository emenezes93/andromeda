import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTemplateReport } from '@/api/stats';
import type { TemplateReport } from '@/api/stats';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const PERIOD_OPTIONS = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
] as const;

export function TemplateReportPage() {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<TemplateReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodDays, setPeriodDays] = useState<number>(30);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTemplateReport(id, { days: periodDays })
      .then((data) => {
        if (!cancelled) setReport(data);
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
  }, [id, periodDays]);

  if (!id) {
    return (
      <Card>
        <p className="text-content-muted">ID do template não fornecido.</p>
        <Link to="/templates">
          <Button className="mt-4">Voltar aos templates</Button>
        </Link>
      </Card>
    );
  }

  if (loading && !report) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !report) {
    return (
      <Card>
        <p className="text-error">{error}</p>
        <Link to="/templates">
          <Button className="mt-4">Voltar aos templates</Button>
        </Link>
      </Card>
    );
  }

  if (!report) {
    return (
      <Card>
        <p className="text-content-muted">Relatório não encontrado.</p>
        <Link to="/templates">
          <Button className="mt-4">Voltar aos templates</Button>
        </Link>
      </Card>
    );
  }

  const { template, period, metrics, sessions } = report;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-heading font-semibold text-content">Relatório: {template.name}</h1>
          <p className="mt-1 text-body-sm text-content-muted">
            Período: {new Date(period.from).toLocaleDateString('pt-BR')} a{' '}
            {new Date(period.to).toLocaleDateString('pt-BR')}
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

      {/* Métricas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card padding="md" className="border-l-4 border-l-primary">
          <p className="text-body-sm font-medium text-content-muted">Total de sessões</p>
          <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">
            {metrics.totalSessions}
          </p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-primary">
          <p className="text-body-sm font-medium text-content-muted">Sessões concluídas</p>
          <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">
            {metrics.completedSessions}
          </p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-primary">
          <p className="text-body-sm font-medium text-content-muted">Taxa de conclusão</p>
          <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">
            {metrics.completionRate}%
          </p>
        </Card>
        <Card padding="md" className="border-l-4 border-l-primary">
          <p className="text-body-sm font-medium text-content-muted">Tempo médio</p>
          <p className="mt-1 text-heading-lg font-bold text-content tabular-nums">
            {metrics.avgDurationMinutes !== null
              ? `${metrics.avgDurationMinutes} min`
              : '—'}
          </p>
        </Card>
      </div>

      {/* Lista de sessões */}
      <Card title="Sessões" padding="none">
        {sessions.length === 0 ? (
          <p className="px-5 py-8 text-body text-content-muted">Nenhuma sessão no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b border-border-muted bg-surface-muted">
                  <th className="px-4 py-3 font-medium text-content-muted">Data</th>
                  <th className="px-4 py-3 font-medium text-content-muted">Status</th>
                  <th className="px-4 py-3 text-right font-medium text-content-muted">Ações</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border-muted transition-calm hover:bg-surface-muted"
                  >
                    <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                      {new Date(s.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-button px-2 py-0.5 text-xs font-medium ${
                          s.status === 'completed'
                            ? 'bg-success-subtle text-success'
                            : 'bg-surface-muted text-content-muted'
                        }`}
                      >
                        {s.status === 'completed' ? 'Concluída' : 'Em andamento'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/sessions/${s.id}`}>
                        <Button variant="ghost" size="sm">
                          Ver
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex justify-end">
        <Link to="/templates">
          <Button variant="secondary">Voltar aos templates</Button>
        </Link>
      </div>
    </div>
  );
}
