import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  createScheduledQuestionnaire,
  updateScheduledQuestionnaire,
  listScheduledQuestionnaires,
} from '@/api/scheduled-questionnaires';
import { listTemplates } from '@/api/templates';
import { listPatients } from '@/api/patients';
import type {
  CreateScheduledQuestionnaireBody,
  QuestionnaireFrequency,
  ScheduledQuestionnaire,
  PatientWithCount,
} from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

type Template = { id: string; name: string };

const FREQUENCY_OPTIONS: { value: QuestionnaireFrequency; label: string }[] = [
  { value: 'weekly', label: 'Semanal' },
  { value: 'biweekly', label: 'Quinzenal' },
  { value: 'monthly', label: 'Mensal' },
  { value: 'quarterly', label: 'Trimestral' },
];

const DAY_OF_WEEK_OPTIONS = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' },
];

interface FormState {
  templateId: string;
  patientId: string;
  frequency: QuestionnaireFrequency;
  dayOfWeek: string;
  dayOfMonth: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

function emptyForm(): FormState {
  const today = new Date().toISOString().split('T')[0];
  return {
    templateId: '',
    patientId: '',
    frequency: 'monthly',
    dayOfWeek: '1',
    dayOfMonth: '1',
    startDate: today,
    endDate: '',
    active: true,
  };
}

function needsDayOfWeek(f: QuestionnaireFrequency) {
  return f === 'weekly' || f === 'biweekly';
}

function needsDayOfMonth(f: QuestionnaireFrequency) {
  return f === 'monthly' || f === 'quarterly';
}

export function ScheduledQuestionnaireFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [initialForm, setInitialForm] = useState<FormState>(emptyForm);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [patients, setPatients] = useState<PatientWithCount[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingItem, setLoadingItem] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const { showConfirmModal, confirmLeave, cancelLeave, message } = useUnsavedChanges(
    isDirty && !submitting
  );

  // Load templates and patients
  useEffect(() => {
    setLoadingData(true);
    Promise.all([
      listTemplates({ page: 1, limit: 100 }),
      listPatients({ page: 1, limit: 200 }),
    ])
      .then(([tRes, pRes]) => {
        setTemplates(tRes.data.map((t) => ({ id: t.id, name: t.name })));
        setPatients(pRes.data);
      })
      .catch(() => {})
      .finally(() => setLoadingData(false));
  }, []);

  // Load existing item in edit mode
  useEffect(() => {
    if (!isEditMode || !id) return;
    setLoadingItem(true);
    listScheduledQuestionnaires({ limit: 1 })
      .then((res) => {
        // fetch by id — use list with a workaround until we have getScheduledQuestionnaire
        const item = res.data.find((i) => i.id === id);
        if (!item) throw new Error('Agendamento não encontrado');
        populateForm(item);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Erro ao carregar'))
      .finally(() => setLoadingItem(false));
  }, [id, isEditMode, toast]);

  function populateForm(item: ScheduledQuestionnaire) {
    const loaded: FormState = {
      templateId: item.templateId,
      patientId: item.patientId ?? '',
      frequency: item.frequency,
      dayOfWeek: item.dayOfWeek != null ? String(item.dayOfWeek) : '1',
      dayOfMonth: item.dayOfMonth != null ? String(item.dayOfMonth) : '1',
      startDate: item.startDate.split('T')[0],
      endDate: item.endDate ? item.endDate.split('T')[0] : '',
      active: item.active,
    };
    setForm(loaded);
    setInitialForm(loaded);
  }

  function handleChange<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.templateId) next.templateId = 'Selecione um template.';
    if (!form.startDate) next.startDate = 'Data de início é obrigatória.';
    if (needsDayOfWeek(form.frequency) && !form.dayOfWeek)
      next.dayOfWeek = 'Selecione o dia da semana.';
    if (needsDayOfMonth(form.frequency)) {
      const n = Number(form.dayOfMonth);
      if (!form.dayOfMonth || n < 1 || n > 31)
        next.dayOfMonth = 'Informe um dia do mês válido (1-31).';
    }
    if (form.endDate && form.endDate < form.startDate)
      next.endDate = 'Data de término deve ser após a data de início.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const body: CreateScheduledQuestionnaireBody = {
        templateId: form.templateId,
        ...(form.patientId && { patientId: form.patientId }),
        frequency: form.frequency,
        ...(needsDayOfWeek(form.frequency) && { dayOfWeek: Number(form.dayOfWeek) }),
        ...(needsDayOfMonth(form.frequency) && { dayOfMonth: Number(form.dayOfMonth) }),
        startDate: form.startDate,
        ...(form.endDate && { endDate: form.endDate }),
      };

      if (isEditMode && id) {
        await updateScheduledQuestionnaire(id, { ...body, active: form.active });
        toast.success('Agendamento atualizado.');
        navigate('/scheduled-questionnaires');
      } else {
        await createScheduledQuestionnaire(body);
        toast.success('Agendamento criado.');
        navigate('/scheduled-questionnaires');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar agendamento.');
      setSubmitting(false);
    }
  }

  if (loadingItem) {
    return (
      <div className="flex justify-center py-16">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const selectClass = (hasError?: boolean) =>
    `w-full rounded-input border bg-surface px-3 py-2.5 text-body text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 ${hasError ? 'border-error' : 'border-border'}`;

  return (
    <>
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-heading font-semibold text-content">
          {isEditMode ? 'Editar agendamento' : 'Novo agendamento de questionário'}
        </h2>
        <Link to="/scheduled-questionnaires">
          <Button variant="secondary" size="sm">
            Cancelar
          </Button>
        </Link>
      </div>

      <Card padding="md">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Template */}
          <div>
            <label htmlFor="sq-template" className="mb-1.5 block text-body-sm font-medium text-content-muted">
              Template <span className="text-error">*</span>
            </label>
            <select
              id="sq-template"
              value={form.templateId}
              onChange={(e) => handleChange('templateId', e.target.value)}
              disabled={loadingData || isEditMode}
              className={selectClass(!!errors.templateId)}
            >
              <option value="">
                {loadingData ? 'Carregando templates…' : 'Selecione um template'}
              </option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.templateId && (
              <p className="mt-1 text-body-sm text-error">{errors.templateId}</p>
            )}
          </div>

          {/* Paciente (opcional) */}
          <div>
            <label htmlFor="sq-patient" className="mb-1.5 block text-body-sm font-medium text-content-muted">
              Paciente{' '}
              <span className="text-content-subtle font-normal">(vazio = todos os pacientes)</span>
            </label>
            <select
              id="sq-patient"
              value={form.patientId}
              onChange={(e) => handleChange('patientId', e.target.value)}
              disabled={loadingData}
              className={selectClass()}
            >
              <option value="">Todos os pacientes do tenant</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Frequência */}
          <div>
            <label className="mb-2 block text-body-sm font-medium text-content-muted">
              Frequência <span className="text-error">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleChange('frequency', opt.value)}
                  className={`rounded-button border px-4 py-2 text-body-sm font-medium transition-calm ${
                    form.frequency === opt.value
                      ? 'border-primary bg-primary text-white'
                      : 'border-border text-content hover:bg-surface-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dia da semana (weekly/biweekly) */}
          {needsDayOfWeek(form.frequency) && (
            <div>
              <label htmlFor="sq-dow" className="mb-1.5 block text-body-sm font-medium text-content-muted">
                Dia da semana <span className="text-error">*</span>
              </label>
              <select
                id="sq-dow"
                value={form.dayOfWeek}
                onChange={(e) => handleChange('dayOfWeek', e.target.value)}
                className={selectClass(!!errors.dayOfWeek)}
              >
                {DAY_OF_WEEK_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {errors.dayOfWeek && (
                <p className="mt-1 text-body-sm text-error">{errors.dayOfWeek}</p>
              )}
            </div>
          )}

          {/* Dia do mês (monthly/quarterly) */}
          {needsDayOfMonth(form.frequency) && (
            <Input
              label="Dia do mês"
              name="dayOfMonth"
              type="number"
              required
              min={1}
              max={31}
              placeholder="ex: 1"
              value={form.dayOfMonth}
              onChange={(e) => handleChange('dayOfMonth', e.target.value)}
              error={errors.dayOfMonth}
            />
          )}

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
              min={form.startDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              error={errors.endDate}
            />
          </div>

          {/* Ativo (edit only) */}
          {isEditMode && (
            <div className="flex items-center gap-3">
              <input
                id="sq-active"
                type="checkbox"
                checked={form.active}
                onChange={(e) => handleChange('active', e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="sq-active" className="cursor-pointer text-body text-content">
                Agendamento ativo
              </label>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button type="submit" loading={submitting} disabled={submitting}>
              {isEditMode ? 'Salvar alterações' : 'Criar agendamento'}
            </Button>
            <Link to="/scheduled-questionnaires">
              <Button type="button" variant="secondary" disabled={submitting}>
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
