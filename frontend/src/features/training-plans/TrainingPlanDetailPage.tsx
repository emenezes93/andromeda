import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTrainingPlan } from '@/api/training-plans';
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
import type {
  TrainingPlan,
  TrainingExecution,
  ProgressPhoto,
  CreateTrainingExecutionBody,
  CreateProgressPhotoBody,
} from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

// ---------------------------------------------------------------------------
// PlanStructureView — renders structured planJson (new format) or raw JSON
// ---------------------------------------------------------------------------

interface ExerciseRow {
  id?: string;
  name?: string;
  sets?: number;
  reps?: string;
  rest?: string;
  muscleGroup?: string;
  tip?: string;
}

interface PlanDay {
  id?: string;
  label?: string;
  focus?: string;
  exercises?: ExerciseRow[];
}

function PlanStructureView({ planJson }: { planJson: Record<string, unknown> }) {
  if (!Array.isArray(planJson.days) || planJson.days.length === 0) {
    return (
      <pre className="overflow-x-auto rounded-input bg-surface-muted p-4 text-body-sm text-content">
        {JSON.stringify(planJson, null, 2)}
      </pre>
    );
  }

  const days = planJson.days as PlanDay[];
  const levelEmoji: Record<string, string> = {
    beginner: '🌱',
    intermediate: '⚡',
    advanced: '🔥',
    custom: '✏️',
  };
  const level = String(planJson.level ?? 'custom');

  return (
    <div className="space-y-4">
      {typeof planJson.level === 'string' && (
        <div className="flex items-center gap-2">
          <span className="text-lg">{levelEmoji[level] ?? '🏋️'}</span>
          <span className="text-body-sm font-medium text-content-muted capitalize">{level}</span>
        </div>
      )}
      {days.map((day, di) => (
        <div key={day.id ?? di} className="rounded-card border border-border">
          <div className="flex items-center gap-2 border-b border-border bg-surface-muted px-4 py-2.5">
            <span className="font-semibold text-content">{day.label ?? `Dia ${di + 1}`}</span>
            {day.focus && (
              <span className="text-body-sm text-content-muted">· {day.focus}</span>
            )}
            {day.exercises && (
              <span className="ml-auto text-xs text-content-subtle">
                {day.exercises.length} exercício{day.exercises.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="divide-y divide-border px-4">
            {(day.exercises ?? []).map((ex, ei) => (
              <div key={ex.id ?? ei} className="flex flex-wrap items-center gap-2 py-2.5">
                <span className="font-medium text-content">{ex.name ?? '—'}</span>
                {ex.muscleGroup && (
                  <span className="rounded-button bg-surface-muted px-1.5 py-0.5 text-xs text-content-muted">
                    {ex.muscleGroup}
                  </span>
                )}
                <span className="ml-auto text-sm text-content-muted">
                  {ex.sets}×{ex.reps}
                  {ex.rest && <span className="ml-1 text-content-subtle">· {ex.rest}</span>}
                </span>
                {ex.tip && (
                  <p className="w-full text-xs text-content-subtle">💡 {ex.tip}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatDateTime(value: string): string {
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

type TabId = 'info' | 'executions' | 'photos';

// ---------------------------------------------------------------------------
// Executions tab inline form
// ---------------------------------------------------------------------------

interface AddExecutionFormProps {
  planId: string;
  patientId: string;
  onSaved: () => void;
}

function AddExecutionForm({ planId, patientId, onSaved }: AddExecutionFormProps) {
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];
  const [executedAt, setExecutedAt] = useState(today);
  const [durationMinutes, setDurationMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!executedAt) {
      toast.error('Informe a data de execução.');
      return;
    }
    setSubmitting(true);
    try {
      const body: CreateTrainingExecutionBody = {
        patientId,
        trainingPlanId: planId,
        executedAt: new Date(executedAt).toISOString(),
        durationMinutes: durationMinutes ? Number(durationMinutes) : undefined,
        notes: notes.trim() || undefined,
        completed,
      };
      await createTrainingExecution(body);
      toast.success('Execução registrada.');
      setExecutedAt(today);
      setDurationMinutes('');
      setNotes('');
      setCompleted(false);
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar execução.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Data de execução"
          type="date"
          name="executedAt"
          required
          value={executedAt}
          onChange={(e) => setExecutedAt(e.target.value)}
        />
        <Input
          label="Duração (minutos)"
          type="number"
          name="durationMinutes"
          min="1"
          placeholder="ex: 60"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
        />
      </div>
      <div>
        <label
          htmlFor="exec-notes"
          className="mb-1.5 block text-body-sm font-medium text-content-muted"
        >
          Notas
        </label>
        <textarea
          id="exec-notes"
          name="notes"
          rows={2}
          placeholder="Observações sobre a execução…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[64px] w-full rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content placeholder-content-subtle transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          id="exec-completed"
          type="checkbox"
          checked={completed}
          onChange={(e) => setCompleted(e.target.checked)}
          className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
        />
        <label htmlFor="exec-completed" className="text-body text-content cursor-pointer">
          Concluído
        </label>
      </div>
      <Button type="submit" loading={submitting} disabled={submitting}>
        Registrar execução
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Photos tab inline form
// ---------------------------------------------------------------------------

interface AddPhotoFormProps {
  patientId: string;
  onSaved: () => void;
}

function AddPhotoForm({ patientId, onSaved }: AddPhotoFormProps) {
  const toast = useToast();
  const today = new Date().toISOString().split('T')[0];
  const [imageUrl, setImageUrl] = useState('');
  const [takenAt, setTakenAt] = useState(today);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!imageUrl.trim()) {
      toast.error('Informe a URL da imagem.');
      return;
    }
    if (!takenAt) {
      toast.error('Informe a data da foto.');
      return;
    }
    setSubmitting(true);
    try {
      const body: CreateProgressPhotoBody = {
        patientId,
        imageUrl: imageUrl.trim(),
        takenAt: new Date(takenAt).toISOString(),
        notes: notes.trim() || undefined,
      };
      await createProgressPhoto(body);
      toast.success('Foto adicionada.');
      setImageUrl('');
      setTakenAt(today);
      setNotes('');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar foto.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      <Input
        label="URL da imagem"
        name="imageUrl"
        required
        placeholder="https://…"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
      />
      <Input
        label="Data da foto"
        type="date"
        name="takenAt"
        required
        value={takenAt}
        onChange={(e) => setTakenAt(e.target.value)}
      />
      <div>
        <label
          htmlFor="photo-notes"
          className="mb-1.5 block text-body-sm font-medium text-content-muted"
        >
          Notas
        </label>
        <textarea
          id="photo-notes"
          name="notes"
          rows={2}
          placeholder="Observações sobre a foto…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[64px] w-full rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content placeholder-content-subtle transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <Button type="submit" loading={submitting} disabled={submitting}>
        Adicionar foto
      </Button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function TrainingPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();

  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [executions, setExecutions] = useState<TrainingExecution[]>([]);
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [planError, setPlanError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('info');
  const [showExecForm, setShowExecForm] = useState(false);
  const [showPhotoForm, setShowPhotoForm] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoadingPlan(true);
    setPlanError(null);
    getTrainingPlan(id)
      .then(setPlan)
      .catch((err) =>
        setPlanError(err instanceof Error ? err.message : 'Erro ao carregar plano')
      )
      .finally(() => setLoadingPlan(false));
  }, [id]);

  const loadExecutions = useCallback(() => {
    if (!id) return;
    listTrainingExecutions({ trainingPlanId: id, limit: 50 })
      .then((res) => setExecutions(res.data))
      .catch(() => setExecutions([]));
  }, [id]);

  const loadPhotos = useCallback(() => {
    if (!plan) return;
    listProgressPhotos({ patientId: plan.patientId, limit: 50 })
      .then((res) => setPhotos(res.data))
      .catch(() => setPhotos([]));
  }, [plan]);

  useEffect(() => {
    if (activeTab === 'executions') loadExecutions();
  }, [activeTab, loadExecutions]);

  useEffect(() => {
    if (activeTab === 'photos') loadPhotos();
  }, [activeTab, loadPhotos]);

  async function handleDeleteExecution(execId: string) {
    if (!window.confirm('Remover esta execução?')) return;
    try {
      await deleteTrainingExecution(execId);
      toast.success('Execução removida.');
      loadExecutions();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover execução.');
    }
  }

  async function handleDeletePhoto(photoId: string) {
    if (!window.confirm('Remover esta foto?')) return;
    try {
      await deleteProgressPhoto(photoId);
      toast.success('Foto removida.');
      loadPhotos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao remover foto.');
    }
  }

  if (!id) return <p className="text-content-muted">ID do plano não informado.</p>;

  if (loadingPlan) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (planError || !plan) {
    return (
      <Card className="border-error bg-error-light" padding="md">
        <p className="text-error">{planError ?? 'Plano não encontrado.'}</p>
        <Link to="/training-plans" className="mt-4 inline-block">
          <Button variant="secondary">Voltar à lista</Button>
        </Link>
      </Card>
    );
  }

  const tabs: { id: TabId; label: string }[] = [
    { id: 'info', label: 'Informações' },
    { id: 'executions', label: 'Treinos Realizados' },
    { id: 'photos', label: 'Fotos' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-heading font-semibold text-content">{plan.name}</h2>
            <Badge variant={plan.active ? 'success' : 'default'}>
              {plan.active ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-body-sm text-content-muted">
            <span>
              <span className="font-medium text-content-subtle">Paciente:</span>{' '}
              <Link
                to={`/patients/${plan.patientId}`}
                className="text-primary hover:underline"
              >
                {plan.patientName}
              </Link>
            </span>
            <span>·</span>
            <span>
              <span className="font-medium text-content-subtle">Início:</span>{' '}
              {formatDate(plan.startDate)}
            </span>
            {plan.endDate && (
              <>
                <span>·</span>
                <span>
                  <span className="font-medium text-content-subtle">Fim:</span>{' '}
                  {formatDate(plan.endDate)}
                </span>
              </>
            )}
            <span>·</span>
            <span>
              <span className="font-semibold text-primary">{plan.executionsCount}</span>{' '}
              execução(ões)
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/training-plans/${id}/edit`}>
            <Button variant="secondary" size="sm">
              Editar
            </Button>
          </Link>
          <Link to="/training-plans">
            <Button variant="outline" size="sm">
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-1" aria-label="Abas">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-body-sm font-medium transition-calm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-t-button ${
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

      {/* Tab: Informações */}
      {activeTab === 'info' && (
        <div className="space-y-4">
          {plan.description && (
            <Card title="Descrição" padding="md">
              <p className="whitespace-pre-wrap text-body text-content">{plan.description}</p>
            </Card>
          )}
          <Card title="Estrutura do plano" padding="md">
            <PlanStructureView planJson={plan.planJson} />
          </Card>
        </div>
      )}

      {/* Tab: Treinos Realizados */}
      {activeTab === 'executions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-body font-semibold text-content">Treinos realizados</h3>
            <Button
              variant={showExecForm ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setShowExecForm((v) => !v)}
            >
              {showExecForm ? 'Fechar' : 'Adicionar execução'}
            </Button>
          </div>

          {showExecForm && (
            <Card title="Nova execução" padding="md">
              <AddExecutionForm
                planId={id}
                patientId={plan.patientId}
                onSaved={() => {
                  loadExecutions();
                  setShowExecForm(false);
                }}
              />
            </Card>
          )}

          <Card padding="none">
            {executions.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <p className="text-body text-content-muted">Nenhum treino realizado ainda.</p>
                {!showExecForm && (
                  <Button className="mt-3" size="sm" onClick={() => setShowExecForm(true)}>
                    Registrar treino
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-body-sm">
                  <thead>
                    <tr className="border-b border-border-muted bg-surface-muted">
                      <th className="px-4 py-3 font-medium text-content-muted">Data</th>
                      <th className="px-4 py-3 font-medium text-content-muted">Duração</th>
                      <th className="px-4 py-3 font-medium text-content-muted">Concluído</th>
                      <th className="px-4 py-3 font-medium text-content-muted">Notas</th>
                      <th className="px-4 py-3 text-right font-medium text-content-muted">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((exec) => (
                      <tr
                        key={exec.id}
                        className="border-b border-border-muted transition-calm last:border-0 hover:bg-surface-muted"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                          {formatDateTime(exec.executedAt)}
                        </td>
                        <td className="px-4 py-3 text-content">
                          {exec.durationMinutes != null ? `${exec.durationMinutes} min` : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={exec.completed ? 'success' : 'default'}>
                            {exec.completed ? 'Sim' : 'Não'}
                          </Badge>
                        </td>
                        <td className="max-w-[200px] truncate px-4 py-3 text-content-muted">
                          {exec.notes ?? '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExecution(exec.id)}
                          >
                            Remover
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab: Fotos */}
      {activeTab === 'photos' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-body font-semibold text-content">Fotos de progresso</h3>
            <Button
              variant={showPhotoForm ? 'secondary' : 'primary'}
              size="sm"
              onClick={() => setShowPhotoForm((v) => !v)}
            >
              {showPhotoForm ? 'Fechar' : 'Adicionar foto'}
            </Button>
          </div>

          {showPhotoForm && (
            <Card title="Nova foto" padding="md">
              <AddPhotoForm
                patientId={plan.patientId}
                onSaved={() => {
                  loadPhotos();
                  setShowPhotoForm(false);
                }}
              />
            </Card>
          )}

          {photos.length === 0 ? (
            <Card>
              <p className="text-body text-content-muted">Nenhuma foto de progresso ainda.</p>
              {!showPhotoForm && (
                <Button className="mt-3" size="sm" onClick={() => setShowPhotoForm(true)}>
                  Adicionar foto
                </Button>
              )}
            </Card>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {photos.map((photo) => (
                <li key={photo.id} className="relative">
                  <Card padding="none" className="overflow-hidden">
                    <img
                      src={photo.imageUrl}
                      alt={photo.notes ?? 'Foto de progresso'}
                      className="h-48 w-full object-cover"
                      loading="lazy"
                    />
                    <div className="p-3">
                      <p className="text-body-sm font-medium text-content">
                        {formatDate(photo.takenAt)}
                      </p>
                      {photo.notes && (
                        <p className="mt-1 text-body-sm text-content-muted">{photo.notes}</p>
                      )}
                      <div className="mt-2 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePhoto(photo.id)}
                        >
                          Remover
                        </Button>
                      </div>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
