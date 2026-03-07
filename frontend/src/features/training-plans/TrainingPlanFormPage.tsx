import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { createTrainingPlan, updateTrainingPlan, getTrainingPlan } from '@/api/training-plans';
import { listPatients } from '@/api/patients';
import type { CreateTrainingPlanBody, PatientWithCount } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ExerciseAutocomplete } from '@/components/ui/ExerciseAutocomplete';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { track } from '@/lib/analytics';
import { PLAN_TEMPLATES, templateToSelectedDays } from './planTemplates';
import type { PlanTemplate, SelectedDay, SelectedExercise } from './planTemplates';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Step = 'level' | 'exercises' | 'details';

interface DetailsState {
  patientId: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

interface AddExForm {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  muscleGroup: string;
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function countSelected(days: SelectedDay[]): number {
  return days.reduce((acc, d) => acc + d.exercises.filter((ex) => ex.checked).length, 0);
}

// ---------------------------------------------------------------------------
// Wizard progress indicator
// ---------------------------------------------------------------------------

const CREATE_STEPS = [
  { id: 'level' as Step, label: 'Nível' },
  { id: 'exercises' as Step, label: 'Exercícios' },
  { id: 'details' as Step, label: 'Detalhes' },
];

const EDIT_STEPS = [
  { id: 'exercises' as Step, label: 'Exercícios' },
  { id: 'details' as Step, label: 'Detalhes' },
];

function WizardProgress({ current, isEdit }: { current: Step; isEdit: boolean }) {
  const steps = isEdit ? EDIT_STEPS : CREATE_STEPS;
  const currentIdx = steps.findIndex((s) => s.id === current);

  return (
    <div className="flex items-center gap-1">
      {steps.map((s, i) => {
        const done = i < currentIdx;
        const active = s.id === current;
        return (
          <div key={s.id} className="flex items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-calm ${
                done
                  ? 'bg-success text-white'
                  : active
                    ? 'bg-primary text-white'
                    : 'bg-surface-muted text-content-subtle'
              }`}
            >
              {done ? '✓' : i + 1}
            </div>
            <span
              className={`hidden text-body-sm font-medium sm:inline ${
                active ? 'text-content' : done ? 'text-success' : 'text-content-subtle'
              }`}
            >
              {s.label}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`mx-1 h-0.5 w-6 transition-calm sm:w-10 ${done ? 'bg-success' : 'bg-border'}`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Level card
// ---------------------------------------------------------------------------

function LevelCard({
  template,
  onSelect,
}: {
  template: PlanTemplate;
  onSelect: (t: PlanTemplate) => void;
}) {
  const totalEx = template.days.reduce((a, d) => a + d.exercises.length, 0);
  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      className={`w-full rounded-card border-2 p-5 text-left transition-all hover:scale-[1.02] hover:shadow-card-hover active:scale-[0.98] ${template.borderClass} ${template.bgClass}`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-3xl">{template.emoji}</span>
        <span className={`rounded-button px-2 py-0.5 text-xs font-bold ${template.badgeBg}`}>
          {template.frequency}
        </span>
      </div>
      <h3 className={`mt-3 text-lg font-bold ${template.textClass}`}>{template.name}</h3>
      <p className="mt-0.5 text-sm font-medium text-content">{template.tagline}</p>
      <p className="mt-1 text-xs text-content-muted">{template.subtitle}</p>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-content-muted">
        <span className="inline-flex items-center gap-1 rounded bg-white/60 px-1.5 py-0.5">
          📅 {template.weeks}
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-white/60 px-1.5 py-0.5">
          🏋️ {totalEx} exercícios
        </span>
        <span className="inline-flex items-center gap-1 rounded bg-white/60 px-1.5 py-0.5">
          🗂️ {template.days.length} dias
        </span>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Exercise row
// ---------------------------------------------------------------------------

function ExerciseRow({
  exercise,
  dayId,
  onToggle,
  onEdit,
}: {
  exercise: SelectedExercise;
  dayId: string;
  onToggle: (dayId: string, exId: string) => void;
  onEdit: (dayId: string, exId: string, field: keyof SelectedExercise, value: string | number) => void;
}) {
  return (
    <div className="py-2.5">
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={exercise.checked}
          onChange={() => onToggle(dayId, exercise.id)}
          className="mt-1 h-4 w-4 flex-shrink-0 cursor-pointer rounded border-border text-primary focus:ring-primary"
          aria-label={`Selecionar ${exercise.name}`}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={`text-body font-medium transition-calm ${
                !exercise.checked ? 'text-content-subtle line-through' : 'text-content'
              }`}
            >
              {exercise.name}
            </span>
            <span className="rounded-button bg-surface-muted px-1.5 py-0.5 text-xs text-content-muted">
              {exercise.muscleGroup}
            </span>
          </div>
          {exercise.tip && (
            <p className="mt-0.5 text-xs text-content-subtle">💡 {exercise.tip}</p>
          )}
          {exercise.checked && (
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs">
              <input
                type="number"
                min={1}
                max={20}
                value={exercise.sets}
                onChange={(e) =>
                  onEdit(dayId, exercise.id, 'sets', parseInt(e.target.value) || 1)
                }
                onClick={(e) => e.stopPropagation()}
                title="Séries"
                className="w-12 rounded border border-border bg-surface px-1.5 py-1 text-center text-xs focus:border-primary focus:outline-none"
              />
              <span className="text-content-muted">séries ×</span>
              <input
                type="text"
                value={exercise.reps}
                onChange={(e) => onEdit(dayId, exercise.id, 'reps', e.target.value)}
                onClick={(e) => e.stopPropagation()}
                title="Repetições"
                className="w-16 rounded border border-border bg-surface px-1.5 py-1 text-center text-xs focus:border-primary focus:outline-none"
              />
              <span className="text-content-muted">reps</span>
              <span className="ml-0.5 text-content-subtle">· {exercise.rest} descanso</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function TrainingPlanFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedPatientId = searchParams.get('patientId') ?? '';
  const toast = useToast();

  const [step, setStep] = useState<Step>(isEditMode ? 'exercises' : 'level');
  const [chosenTemplate, setChosenTemplate] = useState<PlanTemplate | null>(null);
  const [days, setDays] = useState<SelectedDay[]>([]);
  const [details, setDetails] = useState<DetailsState>({
    patientId: preselectedPatientId,
    name: '',
    description: '',
    startDate: todayISO(),
    endDate: '',
    active: true,
  });

  const [patients, setPatients] = useState<PatientWithCount[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Per-day add exercise forms
  const [showAddForm, setShowAddForm] = useState<Record<string, boolean>>({});
  const [addForms, setAddForms] = useState<Record<string, AddExForm>>({});

  const selectedCount = countSelected(days);
  const { showConfirmModal, confirmLeave, cancelLeave, message } = useUnsavedChanges(
    !submitting && (selectedCount > 0 || details.name !== '')
  );

  // Load patients
  useEffect(() => {
    setLoadingPatients(true);
    listPatients({ page: 1, limit: 100 })
      .then((res) => setPatients(res.data))
      .catch(() => setPatients([]))
      .finally(() => setLoadingPatients(false));
  }, []);

  // Load plan in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;
    setLoadingPlan(true);
    getTrainingPlan(id)
      .then((plan) => {
        setDetails({
          patientId: plan.patientId,
          name: plan.name,
          description: plan.description ?? '',
          startDate: plan.startDate.split('T')[0],
          endDate: plan.endDate ? plan.endDate.split('T')[0] : '',
          active: plan.active,
        });
        const json = plan.planJson as Record<string, unknown>;
        if (Array.isArray(json.days)) {
          setDays(
            (json.days as Array<Record<string, unknown>>).map((d) => ({
              id: String(d.id ?? ''),
              label: String(d.label ?? ''),
              focus: String(d.focus ?? ''),
              isOpen: false,
              exercises: Array.isArray(d.exercises)
                ? (d.exercises as Array<Record<string, unknown>>).map((ex) => ({
                    id: String(ex.id ?? `ex-${Math.random().toString(36).slice(2)}`),
                    name: String(ex.name ?? ''),
                    sets: Number(ex.sets ?? 3),
                    reps: String(ex.reps ?? '12'),
                    rest: String(ex.rest ?? '60s'),
                    muscleGroup: String(ex.muscleGroup ?? ''),
                    tip: ex.tip ? String(ex.tip) : undefined,
                    checked: true,
                  }))
                : [],
            })),
          );
        }
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao carregar plano'))
      .finally(() => setLoadingPlan(false));
  }, [id, isEditMode, toast]);

  // ---------------------------------------------------------------------------
  // Handlers — Level step
  // ---------------------------------------------------------------------------

  function handleSelectTemplate(template: PlanTemplate) {
    setChosenTemplate(template);
    setDays(templateToSelectedDays(template));
    if (!details.name) {
      setDetails((prev) => ({ ...prev, name: `Plano ${template.name}` }));
    }
    setStep('exercises');
  }

  function handleSelectScratch() {
    setChosenTemplate(null);
    setDays([
      {
        id: `day-${Date.now()}`,
        label: 'Dia 1',
        focus: '',
        exercises: [],
        isOpen: true,
      },
    ]);
    setStep('exercises');
  }

  // ---------------------------------------------------------------------------
  // Handlers — Exercise step
  // ---------------------------------------------------------------------------

  function toggleExercise(dayId: string, exerciseId: string) {
    setDays((prev) =>
      prev.map((d) =>
        d.id !== dayId
          ? d
          : {
              ...d,
              exercises: d.exercises.map((ex) =>
                ex.id !== exerciseId ? ex : { ...ex, checked: !ex.checked },
              ),
            },
      ),
    );
  }

  function editExercise(
    dayId: string,
    exerciseId: string,
    field: keyof SelectedExercise,
    value: string | number,
  ) {
    setDays((prev) =>
      prev.map((d) =>
        d.id !== dayId
          ? d
          : {
              ...d,
              exercises: d.exercises.map((ex) =>
                ex.id !== exerciseId ? ex : { ...ex, [field]: value },
              ),
            },
      ),
    );
  }

  function toggleDay(dayId: string) {
    setDays((prev) =>
      prev.map((d) => (d.id !== dayId ? d : { ...d, isOpen: !d.isOpen })),
    );
  }

  function openAddForm(dayId: string) {
    setShowAddForm((prev) => ({ ...prev, [dayId]: true }));
    setAddForms((prev) => ({
      ...prev,
      [dayId]: prev[dayId] ?? {
        name: '',
        sets: '3',
        reps: '12',
        rest: '60s',
        muscleGroup: '',
      },
    }));
  }

  function addExercise(dayId: string) {
    const form = addForms[dayId];
    if (!form?.name.trim()) return;
    const newEx: SelectedExercise = {
      id: `custom-${Date.now()}`,
      name: form.name.trim(),
      sets: parseInt(form.sets) || 3,
      reps: form.reps || '12',
      rest: form.rest || '60s',
      muscleGroup: form.muscleGroup.trim() || 'Personalizado',
      checked: true,
    };
    setDays((prev) =>
      prev.map((d) =>
        d.id !== dayId ? d : { ...d, exercises: [...d.exercises, newEx] },
      ),
    );
    setShowAddForm((prev) => ({ ...prev, [dayId]: false }));
    setAddForms((prev) => ({
      ...prev,
      [dayId]: { name: '', sets: '3', reps: '12', rest: '60s', muscleGroup: '' },
    }));
  }

  function addDay() {
    const n = days.length + 1;
    setDays((prev) => [
      ...prev,
      {
        id: `day-${Date.now()}`,
        label: `Dia ${n}`,
        focus: '',
        exercises: [],
        isOpen: true,
      },
    ]);
  }

  // ---------------------------------------------------------------------------
  // Handlers — Details step + submit
  // ---------------------------------------------------------------------------

  function handleDetailChange(field: keyof DetailsState, value: string | boolean) {
    setDetails((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  }

  function validateDetails(): boolean {
    const errs: Record<string, string> = {};
    if (!details.patientId) errs.patientId = 'Selecione um paciente.';
    if (!details.name.trim()) errs.name = 'Nome é obrigatório.';
    if (!details.startDate) errs.startDate = 'Data de início é obrigatória.';
    if (details.endDate && details.endDate < details.startDate) {
      errs.endDate = 'Data de término deve ser após a data de início.';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateDetails()) return;
    setSubmitting(true);

    const selectedDays = days
      .map((d) => ({
        id: d.id,
        label: d.label,
        focus: d.focus,
        exercises: d.exercises
          .filter((ex) => ex.checked)
          .map(({ checked: _checked, ...ex }) => ex),
      }))
      .filter((d) => d.exercises.length > 0);

    const planJson: Record<string, unknown> = {
      template: chosenTemplate?.id ?? 'custom',
      level: chosenTemplate?.level ?? 'custom',
      days: selectedDays,
    };

    const body: CreateTrainingPlanBody = {
      patientId: details.patientId,
      name: details.name.trim(),
      description: details.description.trim() || undefined,
      planJson,
      startDate: details.startDate,
      endDate: details.endDate || undefined,
      active: details.active,
    };

    try {
      if (isEditMode && id) {
        await updateTrainingPlan(id, body);
        toast.success('Plano atualizado com sucesso.');
        navigate(`/training-plans/${id}`);
      } else {
        const created = await createTrainingPlan(body);
        track({ name: 'training_plan_created', planId: created.id, patientId: body.patientId });
        toast.success('Plano criado! Bom treino! 💪');
        navigate(`/training-plans/${created.id}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar plano.');
      setSubmitting(false);
    }
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loadingPlan) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-heading font-semibold text-content">
          {isEditMode ? 'Editar plano de treino' : 'Novo plano de treino'}
        </h2>
        <div className="flex items-center gap-4">
          <WizardProgress current={step} isEdit={isEditMode} />
          <Link to={isEditMode && id ? `/training-plans/${id}` : '/training-plans'}>
            <Button variant="secondary" size="sm">
              Cancelar
            </Button>
          </Link>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Step: Level                                                         */}
      {/* ------------------------------------------------------------------ */}
      {step === 'level' && (
        <div className="space-y-5">
          <div>
            <h3 className="text-lg font-semibold text-content">Escolha o nível do paciente</h3>
            <p className="mt-1 text-body-sm text-content-muted">
              Selecione um template pronto ou comece do zero. Você poderá personalizar cada
              exercício no próximo passo.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PLAN_TEMPLATES.map((t) => (
              <LevelCard key={t.id} template={t} onSelect={handleSelectTemplate} />
            ))}

            {/* Do zero card */}
            <button
              type="button"
              onClick={handleSelectScratch}
              className="w-full rounded-card border-2 border-dashed border-border p-5 text-left transition-all hover:scale-[1.02] hover:border-primary hover:shadow-card-hover active:scale-[0.98]"
            >
              <span className="text-3xl">✏️</span>
              <h3 className="mt-3 text-lg font-bold text-content">Do zero</h3>
              <p className="mt-0.5 text-sm font-medium text-content-muted">Plano personalizado</p>
              <p className="mt-1 text-xs text-content-subtle">
                Monte seu próprio plano com exercícios totalmente personalizados.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-content-subtle">
                <span className="inline-flex items-center gap-1 rounded bg-surface-muted px-1.5 py-0.5">
                  ✏️ Livre
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Step: Exercises                                                     */}
      {/* ------------------------------------------------------------------ */}
      {step === 'exercises' && (
        <div className="space-y-4">
          {/* Step header */}
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-content">
                {chosenTemplate
                  ? `${chosenTemplate.emoji} Personalize os exercícios`
                  : 'Monte os exercícios'}
              </h3>
              <p className="mt-0.5 text-body-sm text-content-muted">
                Marque os que farão parte do plano e ajuste séries e repetições.
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${
                selectedCount > 0
                  ? 'bg-primary text-white'
                  : 'bg-surface-muted text-content-muted'
              }`}
            >
              {selectedCount} exercício{selectedCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Days */}
          {days.map((day) => {
            const checkedCount = day.exercises.filter((ex) => ex.checked).length;
            return (
              <Card key={day.id} padding="none">
                {/* Day header — toggle open/closed */}
                <button
                  type="button"
                  onClick={() => toggleDay(day.id)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3"
                >
                  <div className="text-left">
                    <span className="font-semibold text-content">{day.label}</span>
                    {day.focus && (
                      <span className="ml-2 text-body-sm text-content-muted">{day.focus}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-surface-muted px-2 py-0.5 text-xs font-medium text-content-muted">
                      {checkedCount}/{day.exercises.length}
                    </span>
                    <svg
                      className={`h-4 w-4 text-content-subtle transition-transform ${day.isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>

                {day.isOpen && (
                  <div className="border-t border-border px-4 pb-4">
                    {day.exercises.length === 0 ? (
                      <p className="py-4 text-center text-sm text-content-subtle">
                        Nenhum exercício ainda. Adicione abaixo.
                      </p>
                    ) : (
                      <div className="divide-y divide-border">
                        {day.exercises.map((ex) => (
                          <ExerciseRow
                            key={ex.id}
                            exercise={ex}
                            dayId={day.id}
                            onToggle={toggleExercise}
                            onEdit={editExercise}
                          />
                        ))}
                      </div>
                    )}

                    {/* Add exercise form */}
                    {showAddForm[day.id] ? (
                      <div className="mt-3 space-y-2 rounded-card bg-surface-muted p-3">
                        <p className="text-body-sm font-semibold text-content">
                          Adicionar exercício
                        </p>
                        <ExerciseAutocomplete
                          value={addForms[day.id]?.name ?? ''}
                          onChange={(name) =>
                            setAddForms((prev) => ({
                              ...prev,
                              [day.id]: { ...prev[day.id], name },
                            }))
                          }
                          onSelect={({ name, muscleGroup }) =>
                            setAddForms((prev) => ({
                              ...prev,
                              [day.id]: {
                                ...prev[day.id],
                                name,
                                muscleGroup: muscleGroup || (prev[day.id]?.muscleGroup ?? ''),
                              },
                            }))
                          }
                          placeholder="Nome do exercício * (busque ou digite)"
                        />
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="number"
                            placeholder="Séries"
                            min={1}
                            value={addForms[day.id]?.sets ?? '3'}
                            onChange={(e) =>
                              setAddForms((prev) => ({
                                ...prev,
                                [day.id]: { ...prev[day.id], sets: e.target.value },
                              }))
                            }
                            className="rounded-input border border-border bg-surface px-3 py-2 text-body text-content focus:border-primary focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Reps"
                            value={addForms[day.id]?.reps ?? '12'}
                            onChange={(e) =>
                              setAddForms((prev) => ({
                                ...prev,
                                [day.id]: { ...prev[day.id], reps: e.target.value },
                              }))
                            }
                            className="rounded-input border border-border bg-surface px-3 py-2 text-body text-content focus:border-primary focus:outline-none"
                          />
                          <input
                            type="text"
                            placeholder="Descanso"
                            value={addForms[day.id]?.rest ?? '60s'}
                            onChange={(e) =>
                              setAddForms((prev) => ({
                                ...prev,
                                [day.id]: { ...prev[day.id], rest: e.target.value },
                              }))
                            }
                            className="rounded-input border border-border bg-surface px-3 py-2 text-body text-content focus:border-primary focus:outline-none"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Grupo muscular (ex: Peito, Costas)"
                          value={addForms[day.id]?.muscleGroup ?? ''}
                          onChange={(e) =>
                            setAddForms((prev) => ({
                              ...prev,
                              [day.id]: { ...prev[day.id], muscleGroup: e.target.value },
                            }))
                          }
                          className="w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-content focus:border-primary focus:outline-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => addExercise(day.id)}
                            disabled={!addForms[day.id]?.name?.trim()}
                          >
                            Adicionar
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() =>
                              setShowAddForm((prev) => ({ ...prev, [day.id]: false }))
                            }
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openAddForm(day.id)}
                        className="mt-3 flex items-center gap-1.5 text-sm text-primary hover:underline"
                      >
                        + Adicionar exercício
                      </button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}

          {/* Add day */}
          <button
            type="button"
            onClick={addDay}
            className="flex w-full items-center justify-center gap-2 rounded-card border-2 border-dashed border-border py-3 text-sm text-content-muted transition-calm hover:border-primary hover:text-primary"
          >
            + Adicionar dia de treino
          </button>

          {/* Navigation */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!isEditMode && (
              <Button variant="secondary" onClick={() => setStep('level')}>
                Voltar
              </Button>
            )}
            <Button onClick={() => setStep('details')} disabled={selectedCount === 0}>
              Continuar — Detalhes
            </Button>
            {selectedCount === 0 && (
              <p className="text-body-sm text-content-muted">
                Selecione pelo menos 1 exercício para continuar.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Step: Details                                                       */}
      {/* ------------------------------------------------------------------ */}
      {step === 'details' && (
        <Card padding="md">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-content">Detalhes do plano</h3>
              {selectedCount > 0 && (
                <p className="mt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-2.5 py-0.5 text-xs font-medium text-primary">
                    ✓ {selectedCount} exercício{selectedCount !== 1 ? 's' : ''} selecionado
                    {selectedCount !== 1 ? 's' : ''}
                  </span>
                </p>
              )}
            </div>

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
                value={details.patientId}
                onChange={(e) => handleDetailChange('patientId', e.target.value)}
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
              placeholder="ex: Treino Full Body — João Silva"
              value={details.name}
              onChange={(e) => handleDetailChange('name', e.target.value)}
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
                rows={3}
                placeholder="Descreva o objetivo e observações do plano…"
                value={details.description}
                onChange={(e) => handleDetailChange('description', e.target.value)}
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
                value={details.startDate}
                onChange={(e) => handleDetailChange('startDate', e.target.value)}
                error={errors.startDate}
              />
              <Input
                label="Data de término (opcional)"
                name="endDate"
                type="date"
                value={details.endDate}
                min={details.startDate || todayISO()}
                onChange={(e) => handleDetailChange('endDate', e.target.value)}
                error={errors.endDate}
              />
            </div>

            {/* Ativo */}
            <div className="flex items-center gap-3">
              <input
                id="plan-active"
                type="checkbox"
                checked={details.active}
                onChange={(e) => handleDetailChange('active', e.target.checked)}
                className="h-4 w-4 cursor-pointer rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="plan-active" className="cursor-pointer text-body text-content">
                Plano ativo
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep('exercises')}
                disabled={submitting}
              >
                Voltar
              </Button>
              <Button type="submit" loading={submitting} disabled={submitting}>
                {isEditMode ? 'Salvar alterações' : 'Criar plano 💪'}
              </Button>
            </div>
          </form>
        </Card>
      )}
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
