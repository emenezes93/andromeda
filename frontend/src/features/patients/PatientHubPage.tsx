import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getPatientHubSummary, getPatientTimeline } from '@/api/patients';
import { listAlerts } from '@/api/alerts';
import { listTrainingExecutions, updateTrainingExecution } from '@/api/training-executions';
import type { PatientTimelineEvent, TrainingExecution } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { TimelineItem } from '@/components/ui/TimelineItem';
import { useToast } from '@/components/ui/Toast';

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const dDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  if (dDate.getTime() === today.getTime()) return `Hoje ${time}`;
  if (dDate.getTime() === yesterday.getTime()) return `Ontem ${time}`;
  const diffDays = Math.floor((today.getTime() - dDate.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 7) return `${diffDays} dias atrás`;
  return formatDate(iso);
}

function riskLabel(value: number): string {
  if (value >= 70) return 'Alto';
  if (value >= 40) return 'Médio';
  return 'Baixo';
}

function riskBar(value: number): string {
  const p = Math.min(100, Math.max(0, value));
  const filled = Math.round((p / 100) * 4);
  return '█'.repeat(filled) + '░'.repeat(4 - filled);
}

export function PatientHubPage() {
  const { id } = useParams<{ id: string }>();

  const { data: summary, isLoading: loadingSummary, error: errorSummary } = useQuery({
    queryKey: ['patient-hub-summary', id],
    queryFn: () => getPatientHubSummary(id!),
    enabled: !!id,
  });

  const { data: timeline, isLoading: loadingTimeline } = useQuery({
    queryKey: ['patient-timeline', id, 15],
    queryFn: () => getPatientTimeline(id!, 15),
    enabled: !!id,
  });

  const { data: executionsData } = useQuery({
    queryKey: ['training-executions', id, 5],
    queryFn: () => listTrainingExecutions({ patientId: id!, limit: 5, page: 1 }),
    enabled: !!id,
  });

  const { data: alertsData } = useQuery({
    queryKey: ['alerts', 'patient', id],
    queryFn: () => listAlerts({ patientId: id!, limit: 20, page: 1 }),
    enabled: !!id,
  });

  const queryClient = useQueryClient();
  const toast = useToast();
  const loading = loadingSummary || loadingTimeline;
  const recentExecutions = executionsData?.data ?? [];
  const patientAlerts = alertsData?.data ?? [];

  if (!id) {
    return (
      <p className="text-content-muted">ID do paciente não informado.</p>
    );
  }

  if (errorSummary) {
    return (
      <Card className="border-error bg-error-light" padding="md">
        <p className="text-error">
          {errorSummary instanceof Error ? errorSummary.message : 'Erro ao carregar hub.'}
        </p>
        <Link to={`/patients/${id}`} className="mt-4 inline-block">
          <Button variant="secondary">Voltar ao paciente</Button>
        </Link>
      </Card>
    );
  }

  if (loading || !summary) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const events: PatientTimelineEvent[] = timeline?.events ?? [];
  const breadcrumbs = [
    { label: 'Pacientes', to: '/patients' },
    { label: summary.fullName, to: `/patients/${id}` },
    { label: 'Hub', to: '' },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumbs items={breadcrumbs} />

      {/* Header: nome, meta principal, botão Avaliar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-heading-lg font-semibold text-content">{summary.fullName}</h1>
          <p className="mt-1 text-body text-content-muted">
            {summary.mainGoal ? `Meta: ${summary.mainGoal}` : 'Sem meta definida'}
          </p>
        </div>
        <Link to={`/sessions/new?patientId=${id}`}>
          <Button variant="primary">Nova avaliação</Button>
        </Link>
      </div>

      {/* Grid: Saúde | Corpo | Treino | Dieta */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Saúde — último insight */}
        <Card title="Saúde (último insight)" padding="md">
          {summary.lastInsight ? (
            <div className="space-y-2">
              {[
                { key: 'stress', label: 'Stress', value: summary.lastInsight.risks.stress },
                { key: 'sleepQuality', label: 'Sono', value: summary.lastInsight.risks.sleepQuality },
                { key: 'dropoutRisk', label: 'Dropout', value: summary.lastInsight.risks.dropoutRisk },
                { key: 'readiness', label: 'Readiness', value: summary.lastInsight.risks.readiness },
              ].map(
                ({ key, label, value }) =>
                  value != null && (
                    <div key={key} className="flex items-center justify-between gap-2 text-body-sm">
                      <span className="text-content-muted">{label}:</span>
                      <span className="font-medium text-content">
                        {riskBar(value)} {riskLabel(value)}
                      </span>
                    </div>
                  )
              )}
              <Link
                to={`/sessions/${summary.lastInsight.sessionId}/insights`}
                className="mt-2 inline-block text-body-sm text-primary hover:underline"
              >
                Ver insights →
              </Link>
            </div>
          ) : (
            <p className="text-body-sm text-content-muted">Nenhum insight ainda.</p>
          )}
        </Card>

        {/* Corpo — última evolução */}
        <Card title="Corpo (última evolução)" padding="md">
          {summary.lastEvolution ? (
            <div className="space-y-1 text-body-sm">
              {summary.lastEvolution.weightKg != null && (
                <p className="text-content">
                  Peso: {summary.lastEvolution.weightKg} kg
                </p>
              )}
              {summary.lastEvolution.bodyFatPercent != null && (
                <p className="text-content">Gordura: {summary.lastEvolution.bodyFatPercent}%</p>
              )}
              {summary.lastEvolution.leanMassKg != null && (
                <p className="text-content">Massa magra: {summary.lastEvolution.leanMassKg} kg</p>
              )}
              {summary.lastEvolution.bmi != null && (
                <p className="text-content">IMC: {summary.lastEvolution.bmi.toFixed(1)}</p>
              )}
              <p className="text-content-subtle">{formatDate(summary.lastEvolution.recordedAt)}</p>
              <Link
                to={`/patients/${id}/evolution`}
                className="mt-2 inline-block text-body-sm text-primary hover:underline"
              >
                Ver evolução →
              </Link>
            </div>
          ) : (
            <p className="text-body-sm text-content-muted">Nenhuma evolução registrada.</p>
          )}
        </Card>

        {/* Treino — últimos 7 dias */}
        <Card title="Treino (últimos 7 dias)" padding="md">
          <div className="space-y-1 text-body-sm">
            <p className="text-content">
              Aderência: {summary.training7d.executionsCount}/{summary.training7d.plannedDays} (
              {summary.training7d.adherencePercent}%)
            </p>
            {summary.training7d.averageDurationMinutes != null && (
              <p className="text-content">
                Duração média: {summary.training7d.averageDurationMinutes} min
              </p>
            )}
            {summary.training7d.lastExecutedAt ? (
              <p className="text-content-subtle">
                Último treino: {formatRelativeDate(summary.training7d.lastExecutedAt)}
              </p>
            ) : (
              <p className="text-content-muted">Nenhum treino nos últimos 7 dias.</p>
            )}
            <Link
              to={`/patients/${id}`}
              className="mt-2 inline-block text-body-sm text-primary hover:underline"
            >
              Ver plano →
            </Link>
          </div>
        </Card>

        {/* Dieta — últimos 7 dias */}
        <Card title="Dieta (últimos 7 dias)" padding="md">
          <div className="space-y-1 text-body-sm">
            <p className="text-content">Streak: {summary.diet.streak} dias</p>
            <p className="text-content">Aderência macro: {summary.diet.macroAdherencePercent}%</p>
            <p className="text-content">Nível: {summary.diet.levelLabel}</p>
            <Link
              to={`/diet-plans?patientId=${id}`}
              className="mt-2 inline-block text-body-sm text-primary hover:underline"
            >
              Ver dieta →
            </Link>
          </div>
        </Card>
      </div>

      {/* Atividade recente + Alertas: duas colunas */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card title="Atividade recente" padding="md">
            {events.length === 0 ? (
              <p className="text-body-sm text-content-muted">Nenhuma atividade recente.</p>
            ) : (
              <div className="space-y-0">
                {events.slice(0, 15).map((event, i) => (
                  <TimelineItem
                    key={event.id}
                    event={event}
                    isLast={i === Math.min(events.length, 15) - 1}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        <div>
          <Card title="Alertas" padding="md">
            {patientAlerts.length === 0 && summary.alerts.length === 0 ? (
              <p className="text-body-sm text-content-muted">Nenhum alerta.</p>
            ) : (
              <ul className="space-y-2">
                {patientAlerts.map((a) => (
                  <li key={a.id}>
                    <Badge variant={a.severity === 'high' ? 'error' : a.severity === 'medium' ? 'warning' : 'default'}>
                      {a.message}
                    </Badge>
                    <span className="ml-1 text-body-xs text-content-subtle">
                      {new Date(a.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                    </span>
                  </li>
                ))}
                {patientAlerts.length === 0 &&
                  summary.alerts.map((a, i) => (
                    <li key={`summary-${i}`}>
                      <Badge variant={a.severity === 'high' ? 'error' : a.severity === 'medium' ? 'warning' : 'default'}>
                        {a.message}
                      </Badge>
                    </li>
                  ))}
              </ul>
            )}
          </Card>

          {summary.goalsWithOrigin?.length > 0 && (
            <Card title="Metas (originadas de avaliações)" padding="md" className="mt-4">
              <ul className="space-y-2">
                {summary.goalsWithOrigin.map((g) => (
                  <li key={g.goalId} className="text-body-sm">
                    <span className="font-medium text-content">{g.title}</span>
                    <span className="text-content-muted">
                      {' '}
                      — {g.targetValue} {g.unit}
                      {g.achievedAt ? ' · Conquistada' : ''}
                    </span>
                    <p className="mt-0.5 text-body-xs text-content-subtle">
                      Originado da avaliação de {formatDate(g.sessionCompletedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {recentExecutions.length > 0 && (
            <Card title="Últimas execuções" padding="md" className="mt-4">
              <ul className="space-y-3">
                {recentExecutions.map((exec) => (
                  <CoachNotesExecutionItem
                    key={exec.id}
                    exec={exec}
                    onSaved={() =>
                      queryClient.invalidateQueries({ queryKey: ['training-executions', id, 5] })
                    }
                    toast={toast}
                    formatDate={formatRelativeDate}
                  />
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function CoachNotesExecutionItem({
  exec,
  onSaved,
  toast,
  formatDate,
}: {
  exec: TrainingExecution;
  onSaved: () => void;
  toast: { success: (m: string) => void; error: (m: string) => void };
  formatDate: (iso: string) => string;
}) {
  const [coachNotes, setCoachNotes] = useState(exec.coachNotes ?? '');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const handleSave = async () => {
    if (!dirty) return;
    setSaving(true);
    try {
      await updateTrainingExecution(exec.id, { coachNotes: coachNotes.trim() || null });
      setDirty(false);
      onSaved();
      toast.success('Notas salvas.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <li className="border-b border-border-muted pb-3 last:border-0 last:pb-0">
      <p className="text-body-sm font-medium text-content">
        {formatDate(exec.executedAt)} — {exec.planName ?? 'Treino'}
      </p>
      <textarea
        className="mt-1 min-h-[56px] w-full rounded-input border border-border bg-surface px-2 py-1.5 text-body-sm text-content placeholder-content-subtle focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
        placeholder="Notas do personal..."
        value={coachNotes}
        onChange={(e) => {
          setCoachNotes(e.target.value);
          setDirty(true);
        }}
        rows={2}
      />
      {dirty && (
        <Button type="button" variant="secondary" size="sm" className="mt-1" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      )}
    </li>
  );
}
