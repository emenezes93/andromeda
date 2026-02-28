import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createGoal, getGoal, updateGoal } from '@/api/goals';
import { listPatients } from '@/api/patients';
import type { CreateGoalBody, UpdateGoalBody, GoalType, PatientWithCount } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: 'weight_loss', label: 'Perda de peso' },
  { value: 'muscle_gain', label: 'Ganho muscular' },
  { value: 'performance', label: 'Desempenho' },
  { value: 'health', label: 'Saúde geral' },
  { value: 'other', label: 'Outro' },
];

interface FormState {
  patientId: string;
  type: GoalType;
  title: string;
  description: string;
  currentValue: string;
  targetValue: string;
  unit: string;
  startDate: string;
  targetDate: string;
}

function emptyForm(preselectedPatientId = ''): FormState {
  const today = new Date().toISOString().split('T')[0];
  const threeMonths = new Date(Date.now() + 90 * 86400_000).toISOString().split('T')[0];
  return {
    patientId: preselectedPatientId,
    type: 'health',
    title: '',
    description: '',
    currentValue: '',
    targetValue: '',
    unit: '',
    startDate: today,
    targetDate: threeMonths,
  };
}

export function GoalFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') ?? '';
  const toast = useToast();

  const [form, setForm] = useState<FormState>(() => emptyForm(preselectedPatientId));
  const [initialForm, setInitialForm] = useState<FormState>(() => emptyForm(preselectedPatientId));
  const [patients, setPatients] = useState<PatientWithCount[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingGoal, setLoadingGoal] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  useUnsavedChanges(isDirty && !submitting);

  useEffect(() => {
    setLoadingPatients(true);
    listPatients({ page: 1, limit: 200 })
      .then((res) => setPatients(res.data))
      .catch(() => setPatients([]))
      .finally(() => setLoadingPatients(false));
  }, []);

  useEffect(() => {
    if (!isEditMode || !id) return;
    setLoadingGoal(true);
    getGoal(id)
      .then((goal) => {
        const loaded: FormState = {
          patientId: goal.patientId,
          type: goal.type,
          title: goal.title,
          description: goal.description ?? '',
          currentValue: goal.currentValue != null ? String(goal.currentValue) : '',
          targetValue: String(goal.targetValue),
          unit: goal.unit,
          startDate: goal.startDate.split('T')[0],
          targetDate: goal.targetDate.split('T')[0],
        };
        setForm(loaded);
        setInitialForm(loaded);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao carregar meta'))
      .finally(() => setLoadingGoal(false));
  }, [id, isEditMode, toast]);

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.patientId) next.patientId = 'Selecione um paciente.';
    if (!form.title.trim()) next.title = 'Título é obrigatório.';
    if (!form.unit.trim()) next.unit = 'Unidade é obrigatória (ex: kg, %).';
    if (!form.targetValue || isNaN(Number(form.targetValue)))
      next.targetValue = 'Valor alvo deve ser um número.';
    if (form.currentValue && isNaN(Number(form.currentValue)))
      next.currentValue = 'Valor atual deve ser um número.';
    if (!form.startDate) next.startDate = 'Data de início é obrigatória.';
    if (!form.targetDate) next.targetDate = 'Prazo é obrigatório.';
    if (form.targetDate && form.startDate && form.targetDate < form.startDate)
      next.targetDate = 'Prazo deve ser após a data de início.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      if (isEditMode && id) {
        const body: UpdateGoalBody = {
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          currentValue: form.currentValue ? Number(form.currentValue) : undefined,
          targetValue: Number(form.targetValue),
          targetDate: form.targetDate,
        };
        await updateGoal(id, body);
        toast.success('Meta atualizada.');
        navigate(`/patients/${form.patientId}`);
      } else {
        const body: CreateGoalBody = {
          patientId: form.patientId,
          type: form.type,
          title: form.title.trim(),
          description: form.description.trim() || undefined,
          currentValue: form.currentValue ? Number(form.currentValue) : undefined,
          targetValue: Number(form.targetValue),
          unit: form.unit.trim(),
          startDate: form.startDate,
          targetDate: form.targetDate,
        };
        await createGoal(body);
        toast.success('Meta criada.');
        navigate(`/patients/${form.patientId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar meta.');
      setSubmitting(false);
    }
  }

  const backPath = form.patientId ? `/patients/${form.patientId}` : '/patients';

  if (loadingGoal) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const selectClass = (hasError?: boolean) =>
    `w-full rounded-input border bg-surface px-3 py-2.5 text-body text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${hasError ? 'border-error' : 'border-border'}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-heading font-semibold text-content">
          {isEditMode ? 'Editar meta' : 'Nova meta'}
        </h2>
        <Link to={backPath}>
          <Button variant="secondary" size="sm">
            Cancelar
          </Button>
        </Link>
      </div>

      <Card padding="md">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Paciente */}
          <div>
            <label htmlFor="goal-patient" className="mb-1.5 block text-body-sm font-medium text-content-muted">
              Paciente <span className="text-error">*</span>
            </label>
            <select
              id="goal-patient"
              value={form.patientId}
              onChange={(e) => handleChange('patientId', e.target.value)}
              disabled={loadingPatients || isEditMode}
              className={selectClass(!!errors.patientId)}
            >
              <option value="">
                {loadingPatients ? 'Carregando…' : 'Selecione um paciente'}
              </option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>
            {errors.patientId && (
              <p className="mt-1 text-body-sm text-error">{errors.patientId}</p>
            )}
          </div>

          {/* Tipo */}
          {!isEditMode && (
            <div>
              <label className="mb-2 block text-body-sm font-medium text-content-muted">
                Tipo <span className="text-error">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {GOAL_TYPES.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleChange('type', opt.value)}
                    className={`rounded-button border px-3 py-1.5 text-body-sm font-medium transition-calm ${
                      form.type === opt.value
                        ? 'border-primary bg-primary text-white'
                        : 'border-border text-content hover:bg-surface-muted'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Título */}
          <Input
            label="Título da meta"
            name="title"
            required
            placeholder="ex: Perder 5 kg até junho"
            value={form.title}
            onChange={(e) => handleChange('title', e.target.value)}
            error={errors.title}
          />

          {/* Descrição */}
          <div>
            <label htmlFor="goal-desc" className="mb-1.5 block text-body-sm font-medium text-content-muted">
              Descrição
            </label>
            <textarea
              id="goal-desc"
              rows={2}
              placeholder="Detalhes ou estratégia…"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="min-h-[64px] w-full rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content placeholder-content-subtle transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Valores + Unidade */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Valor atual"
              name="currentValue"
              type="number"
              placeholder="ex: 90"
              value={form.currentValue}
              onChange={(e) => handleChange('currentValue', e.target.value)}
              error={errors.currentValue}
            />
            <Input
              label="Valor alvo"
              name="targetValue"
              type="number"
              required
              placeholder="ex: 80"
              value={form.targetValue}
              onChange={(e) => handleChange('targetValue', e.target.value)}
              error={errors.targetValue}
            />
            <Input
              label="Unidade"
              name="unit"
              required
              placeholder="ex: kg, %, rep"
              value={form.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              error={errors.unit}
            />
          </div>

          {/* Datas */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Data de início"
              name="startDate"
              type="date"
              required
              value={form.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              error={errors.startDate}
            />
            <Input
              label="Prazo"
              name="targetDate"
              type="date"
              required
              min={form.startDate}
              value={form.targetDate}
              onChange={(e) => handleChange('targetDate', e.target.value)}
              error={errors.targetDate}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" loading={submitting} disabled={submitting}>
              {isEditMode ? 'Salvar alterações' : 'Criar meta'}
            </Button>
            <Link to={backPath}>
              <Button type="button" variant="secondary" disabled={submitting}>
                Cancelar
              </Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
