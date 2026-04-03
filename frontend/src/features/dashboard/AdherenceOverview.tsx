import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { apiFetch } from '@/api/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface AdherenceRow {
  patientId: string;
  fullName: string;
  trainingAdherence7d: number;
  dietStreak: number;
  lastTrainingAt: string | null;
  lastSessionAt: string | null;
  unreadAlerts: number;
  mainGoal: string | null;
  mainGoalStatus: string | null;
}

function formatRelative(dateStr: string | null): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Hoje';
  if (diffDays === 1) return 'Ontem';
  if (diffDays < 7) return `${diffDays}d atras`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem atras`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function adherenceColor(pct: number): string {
  if (pct >= 80) return 'text-success';
  if (pct >= 50) return 'text-warning';
  return 'text-error';
}

export function AdherenceOverview() {
  const [attentionOnly, setAttentionOnly] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ['adherence-overview'],
    queryFn: () => apiFetch<{ data: AdherenceRow[] }>('/v1/stats/adherence-overview'),
    staleTime: 5 * 60 * 1000,
  });

  const rows = data?.data ?? [];

  if (isLoading) {
    return (
      <Card title="Aderencia dos alunos" padding="md">
        <div className="flex justify-center py-6">
          <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      </Card>
    );
  }

  if (rows.length === 0) return null;

  // Sort: lowest adherence first (needs attention)
  const sorted = [...rows].sort((a, b) => a.trainingAdherence7d - b.trainingAdherence7d);
  const now = Date.now();
  const needsAttention = sorted.filter((r) => {
    const lastTrainingMs = r.lastTrainingAt ? new Date(r.lastTrainingAt).getTime() : null;
    const noTrainingIn7Days =
      lastTrainingMs == null || now - lastTrainingMs >= 7 * 24 * 60 * 60 * 1000;
    return r.trainingAdherence7d < 50 || r.unreadAlerts > 0 || noTrainingIn7Days;
  });
  const visibleRows = attentionOnly ? needsAttention : sorted;

  return (
    <Card title="Aderencia dos alunos (7 dias)" padding="none">
      {needsAttention.length > 0 && (
        <div className="border-b border-border-muted bg-warning-light px-4 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-body-sm font-medium text-warning">
              {needsAttention.length} aluno(s) precisam de atencao
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setAttentionOnly(false)}
                className={`rounded-button px-2 py-1 text-body-xs ${attentionOnly ? 'text-content-muted hover:text-content' : 'bg-surface text-content font-medium'}`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setAttentionOnly(true)}
                className={`rounded-button px-2 py-1 text-body-xs ${attentionOnly ? 'bg-warning text-white font-medium' : 'text-warning hover:text-warning/90'}`}
              >
                Precisa atencao
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-body-sm">
          <thead>
            <tr className="border-b border-border-muted text-content-muted">
              <th className="px-4 py-3 font-medium">Aluno</th>
              <th className="px-4 py-3 font-medium text-center">Treino (7d)</th>
              <th className="px-4 py-3 font-medium text-center">Dieta (streak)</th>
              <th className="hidden px-4 py-3 font-medium sm:table-cell">Ultimo treino</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Ultima avaliacao</th>
              <th className="px-4 py-3 font-medium text-center">Alertas</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr
                key={row.patientId}
                className="border-b border-border-muted last:border-0 hover:bg-surface-muted transition-calm"
              >
                <td className="px-4 py-3">
                  <Link
                    to={`/patients/${row.patientId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {row.fullName}
                  </Link>
                  {row.mainGoal && (
                    <p className="mt-0.5 truncate text-content-subtle text-xs max-w-[200px]">
                      {row.mainGoal}
                    </p>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`font-semibold tabular-nums ${adherenceColor(row.trainingAdherence7d)}`}
                  >
                    {row.trainingAdherence7d}%
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge
                    variant={
                      row.dietStreak >= 3
                        ? 'success'
                        : row.dietStreak >= 1
                          ? 'warning'
                          : 'default'
                    }
                  >
                    {row.dietStreak}d
                  </Badge>
                </td>
                <td className="hidden px-4 py-3 text-content-muted sm:table-cell">
                  {formatRelative(row.lastTrainingAt)}
                </td>
                <td className="hidden px-4 py-3 text-content-muted md:table-cell">
                  {formatRelative(row.lastSessionAt)}
                </td>
                <td className="px-4 py-3 text-center">
                  {row.unreadAlerts > 0 ? (
                    <Badge variant="error">{row.unreadAlerts}</Badge>
                  ) : (
                    <span className="text-content-subtle">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
