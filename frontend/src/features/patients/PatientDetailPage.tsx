import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatient, listEvolutions } from '@/api/patients';
import { listSessions } from '@/api/sessions';
import { listTrainingPlans } from '@/api/training-plans';
import {
  listTrainingExecutions,
  createTrainingExecution,
  deleteTrainingExecution,
} from '@/api/training-executions';
import {
  listProgressPhotos,
  createProgressPhoto,
  deleteProgressPhoto,
} from '@/api/progress-photos';
import { listGoals, updateGoal, deleteGoal } from '@/api/goals';
import type {
  PatientWithCount,
  PatientEvolution,
  Session,
  TrainingPlan,
  TrainingExecution,
  ProgressPhoto,
  Goal,
} from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { SessionStatusBadge } from '@/components/ui/SessionStatusBadge';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function genderLabel(gender: string | null | undefined): string {
  if (!gender) return 'Não informado';
  const labels: Record<string, string> = {
    M: 'Masculino',
    F: 'Feminino',
    Other: 'Outro',
    'Prefer not to say': 'Prefere não dizer',
  };
  return labels[gender] ?? gender;
}

function genderVariant(
  gender: string | null | undefined,
): 'default' | 'primary' | 'success' | 'warning' | 'error' {
  if (gender === 'M') return 'primary';
  if (gender === 'F') return 'success';
  return 'default';
}

const todayIso = () => new Date().toISOString().split('T')[0];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InfoRowProps {
  label: string;
  value: string | number | null | undefined;
}

function InfoRow({ label, value }: InfoRowProps) {
  const display = value !== null && value !== undefined && value !== '' ? String(value) : '—';
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-body-sm font-medium text-content-muted">{label}</dt>
      <dd className="text-body text-content">{display}</dd>
    </div>
  );
}

interface TextCardProps {
  title: string;
  text: string;
}

function TextCard({ title, text }: TextCardProps) {
  return (
    <Card title={title} padding="md">
      <p className="text-body text-content leading-relaxed whitespace-pre-wrap">{text}</p>
    </Card>
  );
}

type TabId = 'dados' | 'sessoes' | 'treinos' | 'execucoes' | 'fotos' | 'metas';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function PatientDetailPage() {
  const { id } = useParams<{ id: string }>();

  // ── Core data ──────────────────────────────────────────────────────────
  const [patient, setPatient] = useState<PatientWithCount | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [lastEvolution, setLastEvolution] = useState<PatientEvolution | null>(null);
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [executions, setExecutions] = useState<TrainingExecution[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);

  // ── Loading flags ──────────────────────────────────────────────────────
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [loadingExecutions, setLoadingExecutions] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(false);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [patientError, setPatientError] = useState<string | null>(null);

  // ── Tab ───────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabId>('dados');

  // ── Execution inline form ─────────────────────────────────────────────
  const [showExecForm, setShowExecForm] = useState(false);
  const [execForm, setExecForm] = useState({
    trainingPlanId: '',
    executedAt: todayIso(),
    durationMinutes: '',
    notes: '',
    completed: true,
  });
  const [submittingExec, setSubmittingExec] = useState(false);

  // ── Photo inline form ─────────────────────────────────────────────────
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [photoForm, setPhotoForm] = useState({
    imageUrl: '',
    takenAt: todayIso(),
    notes: '',
  });
  const [submittingPhoto, setSubmittingPhoto] = useState(false);

  // ── Initial loads ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!id) return;
    setLoadingPatient(true);
    setPatientError(null);
    getPatient(id)
      .then(setPatient)
      .catch((err) =>
        setPatientError(err instanceof Error ? err.message : 'Erro ao carregar paciente'),
      )
      .finally(() => setLoadingPatient(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoadingSessions(true);
    listSessions({ page: 1, limit: 20, patientId: id })
      .then((res) => setSessions(res.data.slice(0, 10)))
      .catch(() => setSessions([]))
      .finally(() => setLoadingSessions(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    listEvolutions(id)
      .then((res) => setLastEvolution(res.data[0] ?? null))
      .catch(() => setLastEvolution(null));
  }, [id]);

  // ── Lazy tab loads ─────────────────────────────────────────────────────

  const loadPlans = useCallback(() => {
    if (!id) return;
    setLoadingPlans(true);
    listTrainingPlans({ patientId: id, limit: 50 })
      .then((res) => setPlans(res.data))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, [id]);

  useEffect(() => {
    if (activeTab === 'treinos') loadPlans();
  }, [activeTab, loadPlans]);

  const loadExecutions = useCallback(() => {
    if (!id) return;
    setLoadingExecutions(true);
    listTrainingExecutions({ patientId: id, limit: 50 })
      .then((res) => setExecutions(res.data))
      .catch(() => setExecutions([]))
      .finally(() => setLoadingExecutions(false));
  }, [id]);

  useEffect(() => {
    if (activeTab === 'execucoes') loadExecutions();
  }, [activeTab, loadExecutions]);

  const loadPhotos = useCallback(() => {
    if (!id) return;
    setLoadingPhotos(true);
    listProgressPhotos({ patientId: id, limit: 50 })
      .then((res) => setPhotos(res.data))
      .catch(() => setPhotos([]))
      .finally(() => setLoadingPhotos(false));
  }, [id]);

  useEffect(() => {
    if (activeTab === 'fotos') loadPhotos();
  }, [activeTab, loadPhotos]);

  const loadGoals = useCallback(() => {
    if (!id) return;
    setLoadingGoals(true);
    listGoals({ patientId: id, limit: 50 })
      .then((res) => setGoals(res.data))
      .catch(() => setGoals([]))
      .finally(() => setLoadingGoals(false));
  }, [id]);

  useEffect(() => {
    if (activeTab === 'metas') loadGoals();
  }, [activeTab, loadGoals]);

  // ── Submit handlers ────────────────────────────────────────────────────

  async function handleExecSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    setSubmittingExec(true);
    try {
      await createTrainingExecution({
        patientId: id,
        trainingPlanId: execForm.trainingPlanId || undefined,
        executedAt: execForm.executedAt,
        durationMinutes: execForm.durationMinutes ? Number(execForm.durationMinutes) : undefined,
        notes: execForm.notes.trim() || undefined,
        completed: execForm.completed,
      });
      setShowExecForm(false);
      setExecForm({ trainingPlanId: '', executedAt: todayIso(), durationMinutes: '', notes: '', completed: true });
      loadExecutions();
    } catch {
      // errors surfaced via API toast in apiFetch
    } finally {
      setSubmittingExec(false);
    }
  }

  async function handlePhotoSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id || !photoForm.imageUrl.trim()) return;
    setSubmittingPhoto(true);
    try {
      await createProgressPhoto({
        patientId: id,
        imageUrl: photoForm.imageUrl.trim(),
        takenAt: photoForm.takenAt,
        notes: photoForm.notes.trim() || undefined,
      });
      setShowPhotoForm(false);
      setPhotoForm({ imageUrl: '', takenAt: todayIso(), notes: '' });
      loadPhotos();
    } catch {
      // errors surfaced via API toast in apiFetch
    } finally {
      setSubmittingPhoto(false);
    }
  }

  // ── Guards ──────────────────────────────────────────────────────────────

  if (!id) {
    return <p className="text-content-muted">ID do paciente não informado.</p>;
  }

  if (loadingPatient) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (patientError || !patient) {
    return (
      <Card className="border-error bg-error-light" padding="md">
        <p className="text-error">{patientError ?? 'Paciente não encontrado.'}</p>
        <Link to="/patients" className="mt-4 inline-block">
          <Button variant="secondary">Voltar à lista</Button>
        </Link>
      </Card>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'dados', label: 'Dados' },
    { id: 'sessoes', label: `Sessões${patient._count.sessions > 0 ? ` (${patient._count.sessions})` : ''}` },
    { id: 'treinos', label: 'Planos de Treino' },
    { id: 'execucoes', label: 'Execuções' },
    { id: 'fotos', label: 'Fotos' },
    { id: 'metas', label: 'Metas' },
  ];

  const selectClass =
    'w-full rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';
  const textareaClass =
    'min-h-[64px] w-full rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content placeholder-content-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-heading font-semibold text-content">{patient.fullName}</h2>
          <Badge variant={genderVariant(patient.gender)}>{genderLabel(patient.gender)}</Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/patients/${id}/edit`}>
            <Button variant="secondary" size="sm">
              Editar
            </Button>
          </Link>
          <Link to={`/sessions/new?patientId=${id}`}>
            <Button size="sm">Nova sessão</Button>
          </Link>
          <Link to="/patients">
            <Button variant="outline" size="sm">
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Lembrete de evolução ── */}
      {lastEvolution && (() => {
        const recorded = new Date(lastEvolution.recordedAt);
        const now = new Date();
        const days = Math.floor((now.getTime() - recorded.getTime()) / (1000 * 60 * 60 * 24));
        return (
          <Card className="border-primary/30 bg-primary-subtle/30" padding="md">
            <p className="text-body text-content">
              Última evolução há{' '}
              <strong>{days === 0 ? 'hoje' : days === 1 ? '1 dia' : `${days} dias`}</strong>.
              Registrar nova?
            </p>
            <Link to={`/patients/${id}/evolution`} className="mt-3 inline-block">
              <Button size="sm">Registrar evolução</Button>
            </Link>
          </Card>
        );
      })()}

      {/* ── Tabs ── */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-1 overflow-x-auto" aria-label="Abas do paciente">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-4 py-2.5 text-body-sm font-medium transition-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-button ${
                activeTab === tab.id
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-content-muted hover:text-content'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab: Dados ── */}
      {activeTab === 'dados' && (
        <div className="space-y-4">
          <Card title="Dados do paciente" padding="md">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Data de nascimento" value={formatDate(patient.birthDate)} />
              <InfoRow label="CPF" value={patient.cpf} />
              <InfoRow label="Email" value={patient.email} />
              <InfoRow label="Telefone" value={patient.phone} />
              <InfoRow label="Profissão" value={patient.profession} />
              <div className="flex flex-col gap-0.5">
                <dt className="text-body-sm font-medium text-content-muted">Sessões / Evoluções</dt>
                <dd className="flex items-center gap-3 text-body text-content">
                  <span>
                    <span className="font-semibold text-primary">{patient._count.sessions}</span>{' '}
                    <span className="text-content-muted">sessões</span>
                  </span>
                  <span className="text-border-soft">·</span>
                  <span>
                    <span className="font-semibold text-primary">{patient._count.evolutions}</span>{' '}
                    <span className="text-content-muted">evoluções</span>
                  </span>
                </dd>
              </div>
            </dl>
          </Card>

          {patient.mainGoal && <TextCard title="Objetivo principal" text={patient.mainGoal} />}
          {patient.mainComplaint && (
            <TextCard title="Queixa principal" text={patient.mainComplaint} />
          )}
          {patient.notes && <TextCard title="Observações" text={patient.notes} />}

          <div className="flex flex-wrap gap-3 pt-1">
            <Link to={`/patients/${id}/timeline`}>
              <Button variant="outline" size="sm">
                Prontuário completo
              </Button>
            </Link>
            <Link to={`/patients/${id}/report`}>
              <Button variant="outline" size="sm">
                Relatório
              </Button>
            </Link>
            <Link to={`/patients/${id}/evolution`}>
              <Button variant="outline" size="sm">
                Ver evolução
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* ── Tab: Sessões ── */}
      {activeTab === 'sessoes' && (
        <Card title="Sessões" padding="none">
          {loadingSessions ? (
            <div className="flex justify-center py-10">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="px-5 py-8">
              <p className="text-body text-content-muted">
                Nenhuma sessão registrada para este paciente.
              </p>
              <Link to={`/sessions/new?patientId=${id}`} className="mt-3 inline-block">
                <Button size="sm">Criar sessão</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-sm">
                  <thead>
                    <tr className="border-b border-border-muted bg-surface-muted">
                      <th className="px-4 py-3 font-medium text-content-muted">Data</th>
                      <th className="px-4 py-3 font-medium text-content-muted">Template</th>
                      <th className="px-4 py-3 font-medium text-content-muted">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-content-muted">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr
                        key={s.id}
                        className="border-b border-border-muted transition-calm last:border-0 hover:bg-surface-muted"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                          {formatDate(s.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-medium text-content">
                          {s.template?.name ?? s.templateId.slice(0, 8) + '…'}
                        </td>
                        <td className="px-4 py-3">
                          {s.status && <SessionStatusBadge status={s.status} />}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/sessions/${s.id}`} className="mr-2">
                            <Button variant="ghost" size="sm">
                              Ver
                            </Button>
                          </Link>
                          {s.status !== 'completed' && s.status !== 'cancelled' && (
                            <Link to={`/sessions/${s.id}/flow`}>
                              <Button size="sm" variant="secondary">
                                Continuar
                              </Button>
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-border-muted px-4 py-3">
                <Link
                  to={`/sessions?patientId=${id}`}
                  className="text-body-sm font-medium text-primary hover:underline"
                >
                  Ver todas as sessões deste paciente →
                </Link>
              </div>
            </>
          )}
        </Card>
      )}

      {/* ── Tab: Planos de Treino ── */}
      {activeTab === 'treinos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-body font-semibold text-content">Planos de treino</h3>
            <Link to={`/training-plans/new?patientId=${id}`}>
              <Button size="sm">Novo plano</Button>
            </Link>
          </div>

          {loadingPlans ? (
            <div className="flex justify-center py-10">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : plans.length === 0 ? (
            <Card padding="md">
              <p className="text-body text-content-muted">
                Nenhum plano de treino cadastrado para este paciente.
              </p>
              <Link to={`/training-plans/new?patientId=${id}`} className="mt-3 inline-block">
                <Button size="sm">Criar plano</Button>
              </Link>
            </Card>
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-sm">
                  <thead>
                    <tr className="border-b border-border-muted bg-surface-muted">
                      <th className="px-4 py-3 font-medium text-content-muted">Nome</th>
                      <th className="px-4 py-3 font-medium text-content-muted">Início</th>
                      <th className="px-4 py-3 font-medium text-content-muted">Término</th>
                      <th className="px-4 py-3 font-medium text-content-muted">Execuções</th>
                      <th className="px-4 py-3 font-medium text-content-muted">Status</th>
                      <th className="px-4 py-3 text-right font-medium text-content-muted">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr
                        key={plan.id}
                        className="border-b border-border-muted transition-calm last:border-0 hover:bg-surface-muted"
                      >
                        <td className="px-4 py-3 font-medium text-content">{plan.name}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                          {formatDate(plan.startDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                          {formatDate(plan.endDate)}
                        </td>
                        <td className="px-4 py-3 text-content">
                          <span className="inline-flex items-center rounded-button bg-primary-subtle px-2 py-0.5 text-xs font-medium text-primary">
                            {plan.executionsCount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={plan.active ? 'success' : 'default'}>
                            {plan.active ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/training-plans/${plan.id}`}>
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
              <div className="border-t border-border-muted px-4 py-3">
                <Link
                  to={`/training-plans?patientId=${id}`}
                  className="text-body-sm font-medium text-primary hover:underline"
                >
                  Ver todos os planos deste paciente →
                </Link>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: Execuções ── */}
      {activeTab === 'execucoes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-body font-semibold text-content">Execuções de treino</h3>
            <Button size="sm" onClick={() => setShowExecForm((v) => !v)}>
              {showExecForm ? 'Cancelar' : 'Registrar execução'}
            </Button>
          </div>

          {showExecForm && (
            <Card padding="md">
              <h4 className="mb-4 text-body-sm font-semibold text-content">Nova execução</h4>
              <form onSubmit={handleExecSubmit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
                    Plano de treino (opcional)
                  </label>
                  <select
                    value={execForm.trainingPlanId}
                    onChange={(e) => setExecForm((prev) => ({ ...prev, trainingPlanId: e.target.value }))}
                    className={selectClass}
                  >
                    <option value="">Sem plano específico</option>
                    {plans.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  {plans.length === 0 && (
                    <p className="mt-1 text-xs text-content-subtle">
                      Carregue a aba "Planos de Treino" primeiro para ver os planos disponíveis.
                    </p>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Data"
                    name="executedAt"
                    type="date"
                    required
                    value={execForm.executedAt}
                    onChange={(e) => setExecForm((prev) => ({ ...prev, executedAt: e.target.value }))}
                  />
                  <Input
                    label="Duração (minutos)"
                    name="durationMinutes"
                    type="number"
                    placeholder="ex: 60"
                    value={execForm.durationMinutes}
                    onChange={(e) => setExecForm((prev) => ({ ...prev, durationMinutes: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
                    Observações
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Como foi o treino?"
                    value={execForm.notes}
                    onChange={(e) => setExecForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className={textareaClass}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="exec-completed"
                    type="checkbox"
                    checked={execForm.completed}
                    onChange={(e) => setExecForm((prev) => ({ ...prev, completed: e.target.checked }))}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <label htmlFor="exec-completed" className="text-body-sm text-content">
                    Treino concluído
                  </label>
                </div>

                <Button type="submit" loading={submittingExec} disabled={submittingExec}>
                  Registrar
                </Button>
              </form>
            </Card>
          )}

          {loadingExecutions ? (
            <div className="flex justify-center py-10">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : executions.length === 0 ? (
            <Card padding="md">
              <p className="text-body text-content-muted">
                Nenhuma execução registrada para este paciente.
              </p>
            </Card>
          ) : (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-sm">
                  <thead>
                    <tr className="border-b border-border-muted bg-surface-muted">
                      <th className="px-4 py-3 font-medium text-content-muted">Data</th>
                      <th className="px-4 py-3 font-medium text-content-muted">Plano</th>
                      <th className="px-4 py-3 font-medium text-content-muted">Duração</th>
                      <th className="px-4 py-3 font-medium text-content-muted">Status</th>
                      <th className="px-4 py-3 font-medium text-content-muted">Notas</th>
                      <th className="px-4 py-3 text-right font-medium text-content-muted">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((exec) => (
                      <tr
                        key={exec.id}
                        className="border-b border-border-muted transition-calm last:border-0 hover:bg-surface-muted"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                          {formatDate(exec.executedAt)}
                        </td>
                        <td className="px-4 py-3 text-content">
                          {exec.planName ?? <span className="text-content-subtle">—</span>}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                          {exec.durationMinutes != null ? `${exec.durationMinutes} min` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={exec.completed ? 'success' : 'warning'}>
                            {exec.completed ? 'Concluído' : 'Parcial'}
                          </Badge>
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-content-muted">
                          {exec.notes ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (!window.confirm('Remover esta execução?')) return;
                              try {
                                await deleteTrainingExecution(exec.id);
                                loadExecutions();
                              } catch {
                                // ignore
                              }
                            }}
                          >
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: Fotos ── */}
      {activeTab === 'fotos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-body font-semibold text-content">Fotos de progresso</h3>
            <Button size="sm" onClick={() => setShowPhotoForm((v) => !v)}>
              {showPhotoForm ? 'Cancelar' : 'Adicionar foto'}
            </Button>
          </div>

          {showPhotoForm && (
            <Card padding="md">
              <h4 className="mb-4 text-body-sm font-semibold text-content">Nova foto</h4>
              <form onSubmit={handlePhotoSubmit} className="space-y-4">
                <Input
                  label="URL da imagem"
                  name="imageUrl"
                  required
                  placeholder="https://..."
                  value={photoForm.imageUrl}
                  onChange={(e) => setPhotoForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                />
                <Input
                  label="Data"
                  name="takenAt"
                  type="date"
                  required
                  value={photoForm.takenAt}
                  onChange={(e) => setPhotoForm((prev) => ({ ...prev, takenAt: e.target.value }))}
                />
                <div>
                  <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
                    Observações
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Frente, lateral, costas…"
                    value={photoForm.notes}
                    onChange={(e) => setPhotoForm((prev) => ({ ...prev, notes: e.target.value }))}
                    className={textareaClass}
                  />
                </div>
                <Button type="submit" loading={submittingPhoto} disabled={submittingPhoto}>
                  Salvar foto
                </Button>
              </form>
            </Card>
          )}

          {loadingPhotos ? (
            <div className="flex justify-center py-10">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : photos.length === 0 ? (
            <Card padding="md">
              <p className="text-body text-content-muted">
                Nenhuma foto de progresso registrada para este paciente.
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="overflow-hidden rounded-card border border-border bg-surface"
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.notes ?? 'Foto de progresso'}
                    className="h-48 w-full object-cover"
                    onError={(e) => {
                      const el = e.target as HTMLImageElement;
                      el.style.display = 'none';
                    }}
                  />
                  <div className="p-3">
                    <p className="text-body-sm font-medium text-content">
                      {formatDate(photo.takenAt)}
                    </p>
                    {photo.notes && (
                      <p className="mt-0.5 text-body-sm text-content-muted">{photo.notes}</p>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={async () => {
                        if (!window.confirm('Remover esta foto?')) return;
                        try {
                          await deleteProgressPhoto(photo.id);
                          loadPhotos();
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      Remover
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Metas ── */}
      {activeTab === 'metas' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-body font-semibold text-content">Metas do paciente</h3>
            <Link to={`/goals/new?patientId=${id}`}>
              <Button size="sm">Nova meta</Button>
            </Link>
          </div>

          {loadingGoals ? (
            <div className="flex justify-center py-10">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : goals.length === 0 ? (
            <Card padding="md">
              <p className="text-body text-content-muted">
                Nenhuma meta cadastrada para este paciente.
              </p>
              <Link to={`/goals/new?patientId=${id}`} className="mt-3 inline-block">
                <Button size="sm">Criar meta</Button>
              </Link>
            </Card>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {goals.map((goal) => {
                const progress =
                  goal.currentValue != null
                    ? Math.min(100, Math.max(0, (goal.currentValue / goal.targetValue) * 100))
                    : null;
                const achieved = goal.achievedAt != null;
                return (
                  <li key={goal.id}>
                    <Card padding="md" className={achieved ? 'border-success/40 bg-success-light/30' : ''}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="font-semibold text-content leading-snug">{goal.title}</p>
                          <p className="mt-0.5 text-body-sm text-content-muted capitalize">
                            {goal.type.replace('_', ' ')} · {goal.unit}
                          </p>
                        </div>
                        {achieved ? (
                          <Badge variant="success">Concluída</Badge>
                        ) : (
                          <Badge variant="primary">Em andamento</Badge>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-body-sm">
                        <span className="text-content-muted">
                          {goal.currentValue != null ? goal.currentValue : '—'} /{' '}
                          {goal.targetValue} {goal.unit}
                        </span>
                        {progress != null && (
                          <span className="font-medium text-primary">{Math.round(progress)}%</span>
                        )}
                      </div>

                      {progress != null && (
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                          <div
                            className={`h-full rounded-full transition-all ${achieved ? 'bg-success' : 'bg-primary'}`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-xs text-content-subtle">
                          Prazo: {formatDate(goal.targetDate)}
                        </span>
                        <div className="flex gap-1">
                          <Link to={`/goals/${goal.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              Editar
                            </Button>
                          </Link>
                          {!achieved && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await updateGoal(goal.id, {
                                    achievedAt: new Date().toISOString(),
                                  });
                                  loadGoals();
                                } catch {
                                  // ignore
                                }
                              }}
                            >
                              Concluir
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={async () => {
                              if (!window.confirm('Remover esta meta?')) return;
                              try {
                                await deleteGoal(goal.id);
                                loadGoals();
                              } catch {
                                // ignore
                              }
                            }}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
