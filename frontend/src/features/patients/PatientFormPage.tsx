import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPatient, createPatient, updatePatient } from '@/api/patients';
import type { CreatePatientBody } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type GenderValue = 'M' | 'F' | 'Other' | 'Prefer not to say' | '';

interface FormState {
  fullName: string;
  birthDate: string;
  gender: GenderValue;
  cpf: string;
  email: string;
  phone: string;
  profession: string;
  mainGoal: string;
  mainComplaint: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
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
};

// ---------------------------------------------------------------------------
// Helper: build CreatePatientBody from FormState (null-coerce empty strings)
// ---------------------------------------------------------------------------
function buildBody(form: FormState): CreatePatientBody {
  return {
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
}

// ---------------------------------------------------------------------------
// Shared textarea style (matches Input component look)
// ---------------------------------------------------------------------------
const textareaClass =
  'min-h-[96px] w-full resize-y rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content placeholder-content-subtle transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

const selectClass =
  'min-h-touch w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-content transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PatientFormPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const isEditMode = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loadingData, setLoadingData] = useState(isEditMode);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // --------------------------------------------------------------------------
  // Load existing patient in edit mode
  // --------------------------------------------------------------------------
  useEffect(() => {
    if (!isEditMode || !id) return;

    setLoadingData(true);
    setFetchError(null);

    getPatient(id)
      .then((patient) => {
        setForm({
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
        });
      })
      .catch((err) => {
        setFetchError(err instanceof Error ? err.message : 'Erro ao carregar paciente');
      })
      .finally(() => setLoadingData(false));
  }, [id, isEditMode]);

  // --------------------------------------------------------------------------
  // Field updater
  // --------------------------------------------------------------------------
  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // --------------------------------------------------------------------------
  // Submit
  // --------------------------------------------------------------------------
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);

    if (!form.fullName.trim()) {
      setSubmitError('Nome completo é obrigatório.');
      return;
    }

    const body = buildBody(form);
    setLoadingSubmit(true);

    try {
      if (isEditMode && id) {
        await updatePatient(id, body);
        toast.success('Paciente salvo com sucesso.');
        navigate(`/patients/${id}`);
      } else {
        const created = await createPatient(body);
        toast.success('Paciente salvo com sucesso.');
        navigate(`/patients/${created.id}`);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Erro ao salvar paciente');
      setLoadingSubmit(false);
    }
  }

  // --------------------------------------------------------------------------
  // Loading / fetch error states
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // Form render
  // --------------------------------------------------------------------------
  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      <Card title={isEditMode ? 'Editar paciente' : 'Novo paciente'}>
        <div className="space-y-5">
          {/* Full name */}
          <Input
            label="Nome completo *"
            name="fullName"
            value={form.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
            placeholder="Ex: Ana Paula Souza"
            required
            autoComplete="name"
          />

          {/* Birth date + Gender row */}
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="flex-1">
              <Input
                label="Data de nascimento"
                name="birthDate"
                type="date"
                value={form.birthDate}
                onChange={(e) => setField('birthDate', e.target.value)}
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
                name="gender"
                value={form.gender}
                onChange={(e) => setField('gender', e.target.value as GenderValue)}
                className={selectClass}
              >
                <option value="">Selecione…</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
                <option value="Other">Outro</option>
                <option value="Prefer not to say">Prefere não informar</option>
              </select>
            </div>
          </div>

          {/* CPF + Phone row */}
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="flex-1">
              <Input
                label="CPF"
                name="cpf"
                value={form.cpf}
                onChange={(e) => {
                  // Allow only digits, max 11
                  const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                  setField('cpf', digits);
                }}
                placeholder="Somente números"
                inputMode="numeric"
                maxLength={11}
                autoComplete="off"
              />
            </div>

            <div className="flex-1">
              <Input
                label="Telefone"
                name="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
                placeholder="Ex: (11) 99999-0000"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Email */}
          <Input
            label="E-mail"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            placeholder="paciente@email.com"
            autoComplete="email"
          />

          {/* Profession */}
          <Input
            label="Profissão"
            name="profession"
            value={form.profession}
            onChange={(e) => setField('profession', e.target.value)}
            placeholder="Ex: Professora"
          />

          {/* Main goal */}
          <div>
            <label
              htmlFor="mainGoal"
              className="mb-1.5 block text-body-sm font-medium text-content-muted"
            >
              Objetivo principal
            </label>
            <textarea
              id="mainGoal"
              name="mainGoal"
              value={form.mainGoal}
              onChange={(e) => setField('mainGoal', e.target.value)}
              placeholder="Ex: Perda de peso, melhora do condicionamento físico…"
              rows={3}
              className={textareaClass}
            />
          </div>

          {/* Main complaint */}
          <div>
            <label
              htmlFor="mainComplaint"
              className="mb-1.5 block text-body-sm font-medium text-content-muted"
            >
              Queixa principal
            </label>
            <textarea
              id="mainComplaint"
              name="mainComplaint"
              value={form.mainComplaint}
              onChange={(e) => setField('mainComplaint', e.target.value)}
              placeholder="Ex: Dores lombares, cansaço frequente…"
              rows={3}
              className={textareaClass}
            />
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="mb-1.5 block text-body-sm font-medium text-content-muted"
            >
              Observações
            </label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              placeholder="Informações adicionais relevantes…"
              rows={4}
              className={textareaClass}
            />
          </div>
        </div>
      </Card>

      {/* Submit error */}
      {submitError && (
        <div className="rounded-card border border-error bg-error-light px-4 py-3" role="alert">
          <p className="text-sm font-medium text-error">{submitError}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={loadingSubmit}>
          {isEditMode ? 'Salvar alterações' : 'Criar paciente'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={loadingSubmit}
          onClick={() => navigate(-1)}
        >
          Cancelar
        </Button>
      </div>
    </form>
  );
}
