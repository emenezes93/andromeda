import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPatient, listEvolutions, listSessions } from '@/api/patients';
import { listGoals } from '@/api/goals';
import { listTrainingExecutions } from '@/api/training-executions';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat card (simple metric)
// ─────────────────────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-card border border-border bg-surface p-4 text-center">
      <p className="text-heading-lg font-bold tabular-nums text-primary">{value}</p>
      <p className="mt-0.5 text-body-sm font-medium text-content">{label}</p>
      {sub && <p className="mt-0.5 text-xs text-content-muted">{sub}</p>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────

export function PatientReportPage() {
  const { id } = useParams<{ id: string }>();

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ['report-patient', id],
    queryFn: () => getPatient(id!),
    enabled: !!id,
  });

  const { data: goalsData, isLoading: loadingGoals } = useQuery({
    queryKey: ['report-goals', id],
    queryFn: () => listGoals({ patientId: id!, limit: 100 }),
    enabled: !!id,
  });

  const { data: sessionsData, isLoading: loadingSessions } = useQuery({
    queryKey: ['report-sessions', id],
    queryFn: () => listSessions({ page: 1, limit: 200, patientId: id! }),
    enabled: !!id,
  });

  const { data: evolutionsData, isLoading: loadingEvolutions } = useQuery({
    queryKey: ['report-evolutions', id],
    queryFn: () => listEvolutions(id!),
    enabled: !!id,
  });

  const { data: executionsData, isLoading: loadingExecutions } = useQuery({
    queryKey: ['report-executions', id],
    queryFn: () => listTrainingExecutions({ patientId: id!, limit: 200 }),
    enabled: !!id,
  });

  if (!id) return <p className="text-content-muted">ID do paciente não informado.</p>;

  const loading =
    loadingPatient || loadingGoals || loadingSessions || loadingEvolutions || loadingExecutions;

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────────────────

  const goals = goalsData?.data ?? [];
  const achievedGoals = goals.filter((g) => g.achievedAt != null);
  const activeGoals = goals.filter((g) => g.achievedAt == null);
  const now = new Date();
  const overdueGoals = activeGoals.filter((g) => g.targetDate && new Date(g.targetDate) < now);

  const sessions = sessionsData?.data ?? [];
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const inProgressSessions = sessions.filter((s) => s.status === 'in_progress');

  const evolutions = evolutionsData?.data ?? [];
  const lastEvolution = evolutions[0] ?? null;

  const executions = executionsData?.data ?? [];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const executionsLast30 = executions.filter(
    (e) => new Date(e.executedAt) >= thirtyDaysAgo,
  );
  const completedExecutions = executionsLast30.filter((e) => e.completed);
  const totalMinutesLast30 = executionsLast30.reduce(
    (acc, e) => acc + (e.durationMinutes ?? 0),
    0,
  );

  const printedAt = formatDateTime(now.toISOString());

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          nav, aside, header, .no-print, [data-no-print] {
            display: none !important;
          }
          * { box-shadow: none !important; }
          body { background: white !important; }
          .print-header { display: block !important; }
        }
        .print-header { display: none; }
      `}</style>

      <div className="space-y-6">
        {/* Screen header */}
        <div
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print"
          data-no-print
        >
          <div>
            <h2 className="text-heading font-semibold text-content">Relatório do paciente</h2>
            {patient && (
              <p className="mt-0.5 text-body-sm text-content-muted">{patient.fullName}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => window.print()}>
              Exportar PDF
            </Button>
            <Link to={`/patients/${id}/timeline`}>
              <Button variant="secondary" size="sm">
                Prontuário completo
              </Button>
            </Link>
            <Link to={`/patients/${id}`}>
              <Button variant="outline" size="sm">
                Voltar ao paciente
              </Button>
            </Link>
          </div>
        </div>

        {/* Print-only header */}
        <div className="print-header">
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '4px' }}>
            Relatório do paciente
          </h1>
          {patient && (
            <p style={{ fontSize: '14px', color: '#555', marginBottom: '4px' }}>
              Paciente: <strong>{patient.fullName}</strong>
            </p>
          )}
          <p style={{ fontSize: '12px', color: '#888' }}>Gerado em {printedAt}</p>
          <hr style={{ margin: '12px 0', borderColor: '#ddd' }} />
        </div>

        {/* Patient summary card */}
        {patient && (
          <Card title="Dados do paciente" padding="md">
            <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <dt className="text-body-sm font-medium text-content-muted">Nome completo</dt>
                <dd className="text-body text-content">{patient.fullName}</dd>
              </div>
              <div>
                <dt className="text-body-sm font-medium text-content-muted">Data de nascimento</dt>
                <dd className="text-body text-content">{formatDate(patient.birthDate)}</dd>
              </div>
              <div>
                <dt className="text-body-sm font-medium text-content-muted">Email</dt>
                <dd className="text-body text-content">{patient.email ?? '—'}</dd>
              </div>
              {patient.mainGoal && (
                <div className="sm:col-span-3">
                  <dt className="text-body-sm font-medium text-content-muted">Objetivo principal</dt>
                  <dd className="text-body text-content">{patient.mainGoal}</dd>
                </div>
              )}
            </dl>
          </Card>
        )}

        {/* Metric summary */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Sessões realizadas"
            value={completedSessions.length}
            sub={`${inProgressSessions.length} em andamento`}
          />
          <StatCard
            label="Metas concluídas"
            value={achievedGoals.length}
            sub={`${activeGoals.length} ativas`}
          />
          <StatCard
            label="Treinos (últimos 30 dias)"
            value={completedExecutions.length}
            sub={totalMinutesLast30 > 0 ? `${totalMinutesLast30} min no total` : undefined}
          />
          <StatCard
            label="Evoluções registradas"
            value={evolutions.length}
            sub={lastEvolution ? `Última: ${formatDate(lastEvolution.recordedAt)}` : undefined}
          />
        </div>

        {/* Goals section */}
        <Card title="Metas" padding="md">
          {goals.length === 0 ? (
            <p className="text-body text-content-muted">Nenhuma meta cadastrada.</p>
          ) : (
            <div className="space-y-4">
              {/* Summary badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">{achievedGoals.length} concluídas</Badge>
                <Badge variant="primary">{activeGoals.length - overdueGoals.length} em andamento</Badge>
                {overdueGoals.length > 0 && (
                  <Badge variant="error">{overdueGoals.length} vencidas</Badge>
                )}
              </div>

              {/* Goals list */}
              <ul className="space-y-3">
                {goals.map((goal) => {
                  const achieved = goal.achievedAt != null;
                  const overdue =
                    !achieved && goal.targetDate && new Date(goal.targetDate) < now;
                  const progress =
                    goal.currentValue != null && goal.targetValue > 0
                      ? Math.min(100, Math.max(0, (goal.currentValue / goal.targetValue) * 100))
                      : null;

                  return (
                    <li
                      key={goal.id}
                      className="rounded-card border border-border-muted bg-surface p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-medium text-content">{goal.title}</p>
                          <p className="mt-0.5 text-body-sm text-content-muted capitalize">
                            {goal.type.replace('_', ' ')} · {goal.unit} · Prazo:{' '}
                            {formatDate(goal.targetDate)}
                          </p>
                        </div>
                        {achieved ? (
                          <Badge variant="success">Concluída</Badge>
                        ) : overdue ? (
                          <Badge variant="error">Vencida</Badge>
                        ) : (
                          <Badge variant="primary">Em andamento</Badge>
                        )}
                      </div>

                      {progress != null && (
                        <div className="mt-2">
                          <div className="mb-1 flex justify-between text-xs text-content-muted">
                            <span>
                              {goal.currentValue} / {goal.targetValue} {goal.unit}
                            </span>
                            <span>{Math.round(progress)}%</span>
                          </div>
                          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                            <div
                              className={`h-full rounded-full ${achieved ? 'bg-success' : overdue ? 'bg-error' : 'bg-primary'}`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {achieved && (
                        <p className="mt-1.5 text-xs text-success">
                          Concluída em {formatDate(goal.achievedAt)}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </Card>

        {/* Training executions (last 30 days) */}
        <Card title="Execuções de treino — últimos 30 dias" padding="md">
          {executionsLast30.length === 0 ? (
            <p className="text-body text-content-muted">
              Nenhuma execução de treino nos últimos 30 dias.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead>
                  <tr className="border-b border-border-muted">
                    <th className="pb-2 font-medium text-content-muted">Data</th>
                    <th className="pb-2 font-medium text-content-muted">Plano</th>
                    <th className="pb-2 font-medium text-content-muted">Duração</th>
                    <th className="pb-2 font-medium text-content-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {executionsLast30.map((exec) => (
                    <tr key={exec.id} className="border-b border-border-muted last:border-0">
                      <td className="whitespace-nowrap py-2 pr-4 text-content-muted">
                        {formatDate(exec.executedAt)}
                      </td>
                      <td className="py-2 pr-4 text-content">
                        {exec.planName ?? <span className="text-content-subtle italic">—</span>}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-4 text-content-muted">
                        {exec.durationMinutes != null ? `${exec.durationMinutes} min` : '—'}
                      </td>
                      <td className="py-2">
                        <Badge variant={exec.completed ? 'success' : 'warning'}>
                          {exec.completed ? 'Concluído' : 'Parcial'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        {/* Last evolution */}
        <Card title="Última evolução" padding="md">
          {!lastEvolution ? (
            <p className="text-body text-content-muted">Nenhuma evolução registrada.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-body-sm text-content-muted">
                Registrada em{' '}
                <span className="font-medium text-content">
                  {formatDateTime(lastEvolution.recordedAt)}
                </span>
              </p>
              {lastEvolution.weight != null && (
                <p className="text-body text-content">
                  <span className="font-medium">Peso:</span> {lastEvolution.weight} kg
                </p>
              )}
              {lastEvolution.height != null && (
                <p className="text-body text-content">
                  <span className="font-medium">Altura:</span> {lastEvolution.height} cm
                </p>
              )}
              {lastEvolution.bmi != null && (
                <p className="text-body text-content">
                  <span className="font-medium">IMC:</span> {lastEvolution.bmi.toFixed(1)}
                </p>
              )}
              {lastEvolution.notes && (
                <p className="text-body text-content leading-relaxed">
                  <span className="font-medium">Observações:</span> {lastEvolution.notes}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* Recent sessions */}
        <Card title="Sessões recentes" padding="none">
          {sessions.length === 0 ? (
            <p className="px-5 py-6 text-body text-content-muted">Nenhuma sessão registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead>
                  <tr className="border-b border-border-muted bg-surface-muted">
                    <th className="px-4 py-3 font-medium text-content-muted">Data</th>
                    <th className="px-4 py-3 font-medium text-content-muted">Template</th>
                    <th className="px-4 py-3 font-medium text-content-muted">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, 10).map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-border-muted last:border-0"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-content">
                        {s.template?.name ?? s.templateId.slice(0, 8) + '…'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            s.status === 'completed'
                              ? 'success'
                              : s.status === 'cancelled'
                                ? 'error'
                                : 'warning'
                          }
                        >
                          {s.status === 'completed'
                            ? 'Concluída'
                            : s.status === 'cancelled'
                              ? 'Cancelada'
                              : 'Em andamento'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
