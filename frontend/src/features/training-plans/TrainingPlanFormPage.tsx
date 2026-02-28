import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createTrainingPlan, updateTrainingPlan, getTrainingPlan } from '@/api/training-plans';
import { listPatients } from '@/api/patients';
import type { CreateTrainingPlanBody, PatientWithCount } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

const PLAN_PLACEHOLDER = JSON.stringify(
  { exercises: [{ name: 'Agachamento', sets: 3, reps: '12' }] },
  null,
  2
);

interface FormState {
  patientId: string;
  name: string;
  description: string;
  planJson: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

function emptyForm(): FormState {
  const today = new Date().toISOString().split('T')[0];
  return {
    patientId: '',
    name: '',
    description: '',
    planJson: PLAN_PLACEHOLDER,
    startDate: today,
    endDate: '',
    active: true,
  };
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

export function TrainingPlanFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') ?? '';
  const toast = useToast();

  const [form, setForm] = useState<FormState>(() => ({
    ...emptyForm(),
    patientId: preselectedPatientId,
  }));
  const [initialForm, setInitialForm] = useState<FormState>(() => ({
    ...emptyForm(),
    patientId: preselectedPatientId,
  }));
  const [patients, setPatients] = useState<PatientWithCount[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  useUnsavedChanges(isDirty && !submitting);

  useEffect(() => {
    setLoadingPatients(true);
    listPatients({ page: 1, limit: 100 })
      .then((res) => setPatients(res.data))
      .catch(() => setPatients([]))
      .finally(() => setLoadingPatients(false));
  }, []);

  useEffect(() => {
    if (!isEditMode || !id) return;
    setLoadingPlan(true);
    getTrainingPlan(id)
      .then((plan) => {
        const loaded: FormState = {
          patientId: plan.patientId,
          name: plan.name,
          description: plan.description ?? '',
          planJson: JSON.stringify(plan.planJson, null, 2),
          startDate: plan.startDate.split('T')[0],
          endDate: plan.endDate ? plan.endDate.split('T')[0] : '',
          active: plan.active,
        };
        setForm(loaded);
        setInitialForm(loaded);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao carregar plano'))
      .finally(() => setLoadingPlan(false));
  }, [id, isEditMode, toast]);

  function handleChange(field: keyof FormState, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.patientId) next.patientId = 'Selecione um paciente.';
    if (!form.name.trim()) next.name = 'Nome é obrigatório.';
    if (!form.startDate) next.startDate = 'Data de início é obrigatória.';
    if (form.endDate && form.endDate < form.startDate) {
      next.endDate = 'Data de término deve ser após a data de início.';
    }
    try {
      JSON.parse(form.planJson);
    } catch {
      next.planJson = 'JSON inválido. Verifique a estrutura do plano.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const body: CreateTrainingPlanBody = {
        patientId: form.patientId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        planJson: JSON.parse(form.planJson) as Record<string, unknown>,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        active: form.active,
      };
      if (isEditMode && id) {
        await updateTrainingPlan(id, body);
        toast.success('Plano atualizado com sucesso.');
        navigate(`/training-plans/${id}`);
      } else {
        const created = await createTrainingPlan(body);
        toast.success('Plano criado com sucesso.');
        navigate(`/training-plans/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar plano.');
      setSubmitting(false);
    }
  }

  if (loadingPlan) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-heading font-semibold text-content">
          {isEditMode ? 'Editar plano de treino' : 'Novo plano de treino'}
        </h2>
        <Link to={isEditMode && id ? `/training-plans/${id}` : '/training-plans'}>
          <Button variant="secondary" size="sm">
            Cancelar
          </Button>
        </Link>
      </div>

      <Card padding="md">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Paciente */}
          <div>
            <label
              htmlFor="plan-patient"
              className="mb-1.5 block text-body-sm font-medium text-content-muted"
            >
              Paciente <span className="text-error">*</span>
            </label>
            <select
              id="plan-patient"
              value={form.patientId}
              onChange={(e) => handleChange('patientId', e.target.value)}
              disabled={loadingPatients || isEditMode}
              className={`w-full rounded-input border bg-surface px-3 py-2.5 text-body text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${
                errors.patientId ? 'border-error' : 'border-border'
              }`}
            >
              <option value="">
                {loadingPatients ? 'Carregando pacientes…' : 'Selecione um paciente'}
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

          {/* Nome */}
          <Input
            label="Nome do plano"
            name="name"
            required
            placeholder="ex: Treino de hipertrofia — fase 1"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            error={errors.name}
          />

          {/* Descrição */}
          <div>
            <label
              htmlFor="plan-desc"
              className="mb-1.5 block text-body-sm font-medium text-content-muted"
            >
              Descrição
            </label>
            <textarea
              id="plan-desc"
              name="description"
              rows={3}
              placeholder="Descreva o objetivo e observações do plano…"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="min-h-[80px] w-full rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content placeholder-content-subtle transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
              label="Data de término (opcional)"
              name="endDate"
              type="date"
              value={form.endDate}
              min={form.startDate || today()}
              onChange={(e) => handleChange('endDate', e.target.value)}
              error={errors.endDate}
            />
          </div>

          {/* Ativo */}
          <div className="flex items-center gap-3">
            <input
              id="plan-active"
              type="checkbox"
              checked={form.active}
              onChange={(e) => handleChange('active', e.target.checked)}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="plan-active" className="text-body text-content cursor-pointer">
              Plano ativo
            </label>
          </div>

          {/* Estrutura JSON */}
          <div>
            <label
              htmlFor="plan-json"
              className="mb-1.5 block text-body-sm font-medium text-content-muted"
            >
              Estrutura do plano (JSON)
            </label>
            <textarea
              id="plan-json"
              name="planJson"
              rows={10}
              value={form.planJson}
              onChange={(e) => handleChange('planJson', e.target.value)}
              spellCheck={false}
              className={`min-h-[200px] w-full rounded-input border bg-surface px-3 py-2.5 font-mono text-body-sm text-content placeholder-content-subtle transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                errors.planJson ? 'border-error' : 'border-border'
              }`}
            />
            {errors.planJson && (
              <p className="mt-1 text-body-sm text-error">{errors.planJson}</p>
            )}
            <p className="mt-1 text-body-sm text-content-subtle">
              Estruture os exercícios em JSON. Exemplo:{' '}
              <code className="rounded bg-surface-muted px-1 py-0.5 font-mono text-xs">
                {'{"exercises":[{"name":"Agachamento","sets":3,"reps":"12"}]}'}
              </code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" loading={submitting} disabled={submitting}>
              {isEditMode ? 'Salvar alterações' : 'Criar plano'}
            </Button>
            <Link to={isEditMode && id ? `/training-plans/${id}` : '/training-plans'}>
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
