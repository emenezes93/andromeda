import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { getPatient, createPatient, updatePatient } from '@/api/patients';
import type { CreatePatientBody } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { track } from '@/lib/analytics';

const CONSENT_VERSION = '1.0';

type GenderValue = 'M' | 'F' | 'Other' | 'Prefer not to say' | '';

const patientSchema = z.object({
  fullName: z.string().min(1, 'Nome completo é obrigatório'),
  birthDate: z.string(),
  gender: z.string(),
  cpf: z.string(),
  email: z.string(),
  phone: z.string(),
  profession: z.string(),
  mainGoal: z.string(),
  mainComplaint: z.string(),
  notes: z.string(),
  consentAccepted: z.boolean(),
});

type PatientFormData = z.infer<typeof patientSchema>;

const defaultValues: PatientFormData = {
  fullName: '',
  birthDate: '',
  gender: '',
  cpf: '',
  email: '',
  phone: '',
  profession: '',
  mainGoal: '',
  mainComplaint: '',
  notes: '',
  consentAccepted: false,
};

function buildBody(form: PatientFormData, isEditMode: boolean): CreatePatientBody {
  const base = {
    fullName: form.fullName.trim(),
    birthDate: form.birthDate || null,
    gender: (form.gender as CreatePatientBody['gender']) || null,
    cpf: form.cpf.replace(/\D/g, '') || null,
    email: form.email.trim() || null,
    phone: form.phone.trim() || null,
    profession: form.profession.trim() || null,
    mainGoal: form.mainGoal.trim() || null,
    mainComplaint: form.mainComplaint.trim() || null,
    notes: form.notes.trim() || null,
  };
  if (isEditMode) return base;
  return {
    ...base,
    consentVersion: form.consentAccepted ? CONSENT_VERSION : undefined,
  };
}

const textareaClass =
  'min-h-[96px] w-full resize-y rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content placeholder-content-subtle transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const selectClass =
  'min-h-touch w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-content transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

function formatCpfDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

function formatPhoneDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function PatientFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues,
  });

  const { showConfirmModal, confirmLeave, cancelLeave, message } = useUnsavedChanges(isDirty);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!isEditMode || !id) return;
    setLoadingData(true);
    setFetchError(null);
    getPatient(id)
      .then((patient) => {
        reset({
          fullName: patient.fullName ?? '',
          birthDate: patient.birthDate ? patient.birthDate.slice(0, 10) : '',
          gender: (patient.gender as GenderValue) ?? '',
          cpf: patient.cpf ?? '',
          email: patient.email ?? '',
          phone: patient.phone ?? '',
          profession: patient.profession ?? '',
          mainGoal: patient.mainGoal ?? '',
          mainComplaint: patient.mainComplaint ?? '',
          notes: patient.notes ?? '',
          consentAccepted: true,
        });
      })
      .catch((err) => {
        setFetchError(err instanceof Error ? err.message : 'Erro ao carregar aluno');
      })
      .finally(() => setLoadingData(false));
  }, [id, isEditMode, reset]);

  const onSubmit = async (data: PatientFormData) => {
    if (!isEditMode && !data.consentAccepted) {
      setError('consentAccepted', {
        message:
          'É necessário aceitar a Política de Privacidade e Termos de Uso para cadastrar o aluno.',
      });
      return;
    }
    const body = buildBody(data, isEditMode);
    try {
      if (isEditMode && id) {
        await updatePatient(id, body);
        queryClient.invalidateQueries({ queryKey: ['patients'] });
        queryClient.invalidateQueries({ queryKey: ['patient', id] });
        track({ name: 'form_submit_success', formId: 'patient', action: 'update' });
        toast.success('Aluno salvo com sucesso.');
        navigate(`/patients/${id}`);
      } else {
        const created = await createPatient(body);
        queryClient.invalidateQueries({ queryKey: ['patients'] });
        track({ name: 'form_submit_success', formId: 'patient', action: 'create' });
        track({ name: 'patient_created', patientId: created.id });
        toast.success('Aluno salvo com sucesso.');
        navigate(`/patients/${created.id}`);
      }
    } catch (err) {
      track({ name: 'form_submit_error', formId: 'patient', action: isEditMode ? 'update' : 'create' });
      setError('root', {
        message: err instanceof Error ? err.message : 'Erro ao salvar aluno',
      });
    }
  };

  const fullName = watch('fullName');

  if (loadingData) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="rounded-card border border-error bg-error-light p-5 shadow-card">
        <p className="font-medium text-error">{fetchError}</p>
        <Button className="mt-4" variant="secondary" onClick={() => navigate(-1)}>
          Voltar
        </Button>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'Alunos', to: '/patients' },
    ...(isEditMode && id
      ? [
          { label: fullName.trim() || 'Aluno', to: `/patients/${id}` },
          { label: 'Editar' },
        ]
      : [{ label: 'Novo aluno' }]),
  ];

  return (
    <>
      <div className="space-y-6">
        <Breadcrumbs items={breadcrumbItems} />
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
          <Card title="Dados do aluno">
            <div className="space-y-8">
              {!isEditMode && (
                <section aria-labelledby="patient-form-consent-heading">
                  <h3 id="patient-form-consent-heading" className="text-heading-sm font-semibold text-content mb-3">
                    Consentimento (LGPD)
                  </h3>
                  <div className="rounded-button border border-primary/30 bg-primary-subtle/30 p-4">
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        {...register('consentAccepted')}
                        className="mt-1 rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
                        aria-describedby="consent-desc"
                      />
                      <span id="consent-desc" className="text-body-sm text-content">
                        Li e concordo com a{' '}
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-primary underline hover:no-underline"
                        >
                          Política de Privacidade e Termos de Uso
                        </a>
                        , e autorizo o tratamento dos dados do aluno conforme descrito (LGPD).
                      </span>
                    </label>
                    {errors.consentAccepted && (
                      <p className="mt-1.5 text-body-sm text-error" role="alert">
                        {errors.consentAccepted.message}
                      </p>
                    )}
                  </div>
                </section>
              )}

              <section aria-labelledby="patient-form-pessoais-heading">
                <h3 id="patient-form-pessoais-heading" className="text-heading-sm font-semibold text-content mb-4">
                  Dados pessoais
                </h3>
                <div className="space-y-5">
              <Input
                label="Nome completo *"
                {...register('fullName')}
                placeholder="Ex: Ana Paula Souza"
                autoComplete="name"
                error={errors.fullName?.message}
              />

              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="flex-1">
                  <Input
                    label="Data de nascimento"
                    type="date"
                    {...register('birthDate')}
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="gender"
                    className="mb-1.5 block text-body-sm font-medium text-content-muted"
                  >
                    Gênero
                  </label>
                  <select
                    id="gender"
                    {...register('gender')}
                    className={`${selectClass} ${errors.gender ? 'border-error' : ''}`}
                  >
                    <option value="">Selecione…</option>
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="Other">Outro</option>
                    <option value="Prefer not to say">Prefere não informar</option>
                  </select>
                  {errors.gender && (
                    <p className="mt-1.5 text-body-sm text-error">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="flex-1">
                  <Controller
                    name="cpf"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="CPF"
                        value={formatCpfDisplay(field.value)}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                          field.onChange(digits);
                        }}
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                        maxLength={14}
                        autoComplete="off"
                        error={errors.cpf?.message}
                      />
                    )}
                  />
                </div>
                <div className="flex-1">
                  <Controller
                    name="phone"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label="Telefone"
                        type="tel"
                        value={formatPhoneDisplay(field.value)}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                          field.onChange(digits);
                        }}
                        placeholder="(00) 00000-0000"
                        inputMode="tel"
                        maxLength={15}
                        autoComplete="tel"
                        error={errors.phone?.message}
                      />
                    )}
                  />
                </div>
              </div>

              <Input
                label="E-mail"
                type="email"
                {...register('email')}
                placeholder="aluno@email.com"
                autoComplete="email"
                error={errors.email?.message}
              />

              <Input
                label="Profissão"
                {...register('profession')}
                placeholder="Ex: Professora"
                error={errors.profession?.message}
              />
                </div>
              </section>

              <section aria-labelledby="patient-form-objetivo-heading">
                <h3 id="patient-form-objetivo-heading" className="text-heading-sm font-semibold text-content mb-4">
                  Objetivo e queixa
                </h3>
                <div className="space-y-5">
              <div>
                <label
                  htmlFor="mainGoal"
                  className="mb-1.5 block text-body-sm font-medium text-content-muted"
                >
                  Objetivo principal
                </label>
                <textarea
                  id="mainGoal"
                  {...register('mainGoal')}
                  placeholder="Ex: Perda de peso, melhora do condicionamento físico…"
                  rows={3}
                  className={textareaClass}
                />
              </div>

              <div>
                <label
                  htmlFor="mainComplaint"
                  className="mb-1.5 block text-body-sm font-medium text-content-muted"
                >
                  Queixa principal
                </label>
                <textarea
                  id="mainComplaint"
                  {...register('mainComplaint')}
                  placeholder="Ex: Dores lombares, cansaço frequente…"
                  rows={3}
                  className={textareaClass}
                />
              </div>
                </div>
              </section>

              <section aria-labelledby="patient-form-observacoes-heading">
                <h3 id="patient-form-observacoes-heading" className="text-heading-sm font-semibold text-content mb-4">
                  Observações
                </h3>
              <div>
                <label
                  htmlFor="notes"
                  className="mb-1.5 block text-body-sm font-medium text-content-muted"
                >
                  Observações
                </label>
                <textarea
                  id="notes"
                  {...register('notes')}
                  placeholder="Informações adicionais relevantes…"
                  rows={4}
                  className={textareaClass}
                />
              </div>
              </section>
            </div>
          </Card>

          {errors.root && (
            <div className="rounded-card border border-error bg-error-light px-4 py-3" role="alert">
              <p className="text-sm font-medium text-error">{errors.root.message}</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={isSubmitting}>
              {isEditMode ? 'Salvar alterações' : 'Criar aluno'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => navigate(-1)}
            >
              Cancelar
            </Button>
          </div>
        </form>
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
