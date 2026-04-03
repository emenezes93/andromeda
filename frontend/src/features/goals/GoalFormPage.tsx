import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { createGoal, getGoal, updateGoal } from '@/api/goals';
import { listPatients } from '@/api/patients';
import type { CreateGoalBody, UpdateGoalBody, GoalType, PatientWithCount } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { track } from '@/lib/analytics';

const GOAL_TYPES: { value: GoalType; label: string }[] = [
  { value: 'weight_loss', label: 'Perda de peso' },
  { value: 'muscle_gain', label: 'Ganho muscular' },
  { value: 'performance', label: 'Desempenho' },
  { value: 'health', label: 'Saúde geral' },
  { value: 'other', label: 'Outro' },
];

const goalSchema = z
  .object({
    patientId: z.string().min(1, 'Selecione um aluno.'),
    type: z.enum(['weight_loss', 'muscle_gain', 'performance', 'health', 'other']),
    title: z.string().min(1, 'Título é obrigatório.'),
    description: z.string(),
    currentValue: z.string(),
    targetValue: z.string().min(1, 'Valor alvo é obrigatório.'),
    unit: z.string().min(1, 'Unidade é obrigatória (ex: kg, %).'),
    startDate: z.string().min(1, 'Data de início é obrigatória.'),
    targetDate: z.string().min(1, 'Prazo é obrigatório.'),
  })
  .refine(
    (data) => !data.targetValue || isNaN(Number(data.targetValue)) === false,
    { message: 'Valor alvo deve ser um número.', path: ['targetValue'] }
  )
  .refine(
    (data) => !data.currentValue || isNaN(Number(data.currentValue)) === false,
    { message: 'Valor atual deve ser um número.', path: ['currentValue'] }
  )
  .refine(
    (data) =>
      !data.targetDate ||
      !data.startDate ||
      data.targetDate >= data.startDate,
    { message: 'Prazo deve ser após a data de início.', path: ['targetDate'] }
  );

type GoalFormData = z.infer<typeof goalSchema>;

function defaultValues(preselectedPatientId = ''): GoalFormData {
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

const selectClass = (hasError?: boolean) =>
  `w-full rounded-input border bg-surface px-3 py-2.5 text-body text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${hasError ? 'border-error' : 'border-border'}`;

const textareaClass =
  'min-h-[64px] w-full rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content placeholder-content-subtle transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

export function GoalFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') ?? '';
  const sessionIdFromQuery = searchParams.get('sessionId') ?? null;
  const toast = useToast();
  const queryClient = useQueryClient();

  const [patients, setPatients] = useState<PatientWithCount[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingGoal, setLoadingGoal] = useState(isEditMode);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: defaultValues(preselectedPatientId),
  });

  const { showConfirmModal, confirmLeave, cancelLeave, message } = useUnsavedChanges(
    isDirty && !isSubmitting
  );

  const patientId = watch('patientId');
  const backPath = patientId ? `/patients/${patientId}` : '/patients';

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
        reset({
          patientId: goal.patientId,
          type: goal.type,
          title: goal.title,
          description: goal.description ?? '',
          currentValue: goal.currentValue != null ? String(goal.currentValue) : '',
          targetValue: String(goal.targetValue),
          unit: goal.unit,
          startDate: goal.startDate.split('T')[0],
          targetDate: goal.targetDate.split('T')[0],
        });
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao carregar meta'))
      .finally(() => setLoadingGoal(false));
  }, [id, isEditMode, reset, toast]);

  const onSubmit = async (data: GoalFormData) => {
    try {
      if (isEditMode && id) {
        const body: UpdateGoalBody = {
          title: data.title.trim(),
          description: data.description.trim() || undefined,
          currentValue: data.currentValue ? Number(data.currentValue) : undefined,
          targetValue: Number(data.targetValue),
          targetDate: data.targetDate,
        };
        await updateGoal(id, body);
        queryClient.invalidateQueries({ queryKey: ['goals'] });
        queryClient.invalidateQueries({ queryKey: ['report-goals', data.patientId] });
        queryClient.invalidateQueries({ queryKey: ['patient-goals', data.patientId] });
        toast.success('Meta atualizada.');
        navigate(`/patients/${data.patientId}`);
      } else {
        const body: CreateGoalBody = {
          patientId: data.patientId,
          ...(sessionIdFromQuery && { basedOnSessionId: sessionIdFromQuery }),
          type: data.type,
          title: data.title.trim(),
          description: data.description.trim() || undefined,
          currentValue: data.currentValue ? Number(data.currentValue) : undefined,
          targetValue: Number(data.targetValue),
          unit: data.unit.trim(),
          startDate: data.startDate,
          targetDate: data.targetDate,
        };
        const created = await createGoal(body);
        queryClient.invalidateQueries({ queryKey: ['goals'] });
        queryClient.invalidateQueries({ queryKey: ['report-goals', data.patientId] });
        queryClient.invalidateQueries({ queryKey: ['patient-goals', data.patientId] });
        track({ name: 'goal_created', goalId: created.id, type: created.type });
        toast.success('Meta criada.');
        navigate(`/patients/${data.patientId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar meta.');
    }
  };

  if (loadingGoal) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const goalType = watch('type');

  return (
    <>
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
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label
                htmlFor="goal-patient"
                className="mb-1.5 block text-body-sm font-medium text-content-muted"
              >
                Aluno <span className="text-error">*</span>
              </label>
              <select
                id="goal-patient"
                {...register('patientId')}
                disabled={loadingPatients || isEditMode}
                className={selectClass(!!errors.patientId)}
              >
                <option value="">
                  {loadingPatients ? 'Carregando…' : 'Selecione um aluno'}
                </option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName}
                  </option>
                ))}
              </select>
              {errors.patientId && (
                <p className="mt-1 text-body-sm text-error">{errors.patientId.message}</p>
              )}
            </div>

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
                      onClick={() => setValue('type', opt.value, { shouldDirty: true })}
                      className={`rounded-button border px-3 py-1.5 text-body-sm font-medium transition-calm ${
                        goalType === opt.value
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

            <Input
              label="Título da meta"
              {...register('title')}
              placeholder="ex: Perder 5 kg até junho"
              error={errors.title?.message}
            />

            <div>
              <label
                htmlFor="goal-desc"
                className="mb-1.5 block text-body-sm font-medium text-content-muted"
              >
                Descrição
              </label>
              <textarea
                id="goal-desc"
                rows={2}
                placeholder="Detalhes ou estratégia…"
                {...register('description')}
                className={textareaClass}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Valor atual"
                type="number"
                placeholder="ex: 90"
                {...register('currentValue')}
                error={errors.currentValue?.message}
              />
              <Input
                label="Valor alvo"
                type="number"
                placeholder="ex: 80"
                {...register('targetValue')}
                error={errors.targetValue?.message}
              />
              <Input
                label="Unidade"
                placeholder="ex: kg, %, rep"
                {...register('unit')}
                error={errors.unit?.message}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Data de início"
                type="date"
                {...register('startDate')}
                error={errors.startDate?.message}
              />
              <Input
                label="Prazo"
                type="date"
                min={watch('startDate')}
                {...register('targetDate')}
                error={errors.targetDate?.message}
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button type="submit" loading={isSubmitting} disabled={isSubmitting}>
                {isEditMode ? 'Salvar alterações' : 'Criar meta'}
              </Button>
              <Link to={backPath}>
                <Button type="button" variant="secondary" disabled={isSubmitting}>
                  Cancelar
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
      <ConfirmModal
        open={showConfirmModal}
        title="Alterações não salvas"
        message={message}
        confirmLabel="Sair"
        cancelLabel="Ficar"
        variant="danger"
        onConfirm={confirmLeave}
        onCancel={cancelLeave}
      />
    </>
  );
}
