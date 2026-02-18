import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatient, listEvolutions, createEvolution } from '@/api/patients';
import type { PatientWithCount, PatientEvolution, CreateEvolutionBody } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fmt(value: number | null | undefined, unit = ''): string {
  if (value === null || value === undefined) return '—';
  return `${value}${unit}`;
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

function calcBmi(weightKg: number | null, heightCm: number | null): number | null {
  if (!weightKg || !heightCm || heightCm <= 0) return null;
  const heightM = heightCm / 100;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

// ---------------------------------------------------------------------------
// Form state
// ---------------------------------------------------------------------------

interface FormState {
  recordedAt: string;
  weightKg: string;
  heightCm: string;
  bmi: string;
  waistCm: string;
  hipCm: string;
  waistHipRatio: string;
  bodyFatPercent: string;
  bloodPressureSystolic: string;
  bloodPressureDiastolic: string;
  heartRateBpm: string;
  notes: string;
}

function emptyForm(): FormState {
  // Default recordedAt to now (local datetime-local format)
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const local = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  return {
    recordedAt: local,
    weightKg: '',
    heightCm: '',
    bmi: '',
    waistCm: '',
    hipCm: '',
    waistHipRatio: '',
    bodyFatPercent: '',
    bloodPressureSystolic: '',
    bloodPressureDiastolic: '',
    heartRateBpm: '',
    notes: '',
  };
}

function parseNum(val: string): number | null {
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function formToBody(form: FormState): CreateEvolutionBody {
  return {
    recordedAt: new Date(form.recordedAt).toISOString(),
    weightKg: parseNum(form.weightKg),
    heightCm: parseNum(form.heightCm),
    bmi: parseNum(form.bmi),
    waistCm: parseNum(form.waistCm),
    hipCm: parseNum(form.hipCm),
    waistHipRatio: parseNum(form.waistHipRatio),
    bodyFatPercent: parseNum(form.bodyFatPercent),
    bloodPressureSystolic: parseNum(form.bloodPressureSystolic),
    bloodPressureDiastolic: parseNum(form.bloodPressureDiastolic),
    heartRateBpm: parseNum(form.heartRateBpm),
    notes: form.notes.trim() || null,
  };
}

// ---------------------------------------------------------------------------
// Inline add form
// ---------------------------------------------------------------------------

interface AddFormProps {
  patientId: string;
  onSaved: () => void;
  onCancel: () => void;
}

function AddEvolutionForm({ patientId, onSaved, onCancel }: AddFormProps) {
  const toast = useToast();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Auto-calculate BMI whenever weight or height change
  useEffect(() => {
    const w = parseNum(form.weightKg);
    const h = parseNum(form.heightCm);
    const computed = calcBmi(w, h);
    if (computed !== null) {
      setForm((prev) => ({ ...prev, bmi: String(computed) }));
    }
  }, [form.weightKg, form.heightCm]);

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.recordedAt) next.recordedAt = 'Informe a data e hora.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await createEvolution(patientId, formToBody(form));
      toast.success('Evolução registrada com sucesso.');
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao salvar evolução.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Date/time — full width on all breakpoints */}
        <div className="sm:col-span-2 lg:col-span-3">
          <Input
            label="Data e hora do registro"
            type="datetime-local"
            name="recordedAt"
            value={form.recordedAt}
            onChange={(e) => handleChange('recordedAt', e.target.value)}
            error={errors.recordedAt}
            required
          />
        </div>

        <Input
          label="Peso (kg)"
          type="number"
          name="weightKg"
          min="0"
          step="0.1"
          placeholder="ex: 72.5"
          value={form.weightKg}
          onChange={(e) => handleChange('weightKg', e.target.value)}
        />
        <Input
          label="Altura (cm)"
          type="number"
          name="heightCm"
          min="0"
          step="0.1"
          placeholder="ex: 170"
          value={form.heightCm}
          onChange={(e) => handleChange('heightCm', e.target.value)}
        />
        <div className="relative">
          <Input
            label="IMC (calculado automaticamente)"
            type="number"
            name="bmi"
            min="0"
            step="0.1"
            placeholder="auto"
            value={form.bmi}
            onChange={(e) => handleChange('bmi', e.target.value)}
          />
        </div>

        <Input
          label="Cintura (cm)"
          type="number"
          name="waistCm"
          min="0"
          step="0.1"
          placeholder="ex: 85"
          value={form.waistCm}
          onChange={(e) => handleChange('waistCm', e.target.value)}
        />
        <Input
          label="Quadril (cm)"
          type="number"
          name="hipCm"
          min="0"
          step="0.1"
          placeholder="ex: 100"
          value={form.hipCm}
          onChange={(e) => handleChange('hipCm', e.target.value)}
        />
        <Input
          label="Relação cintura/quadril"
          type="number"
          name="waistHipRatio"
          min="0"
          step="0.01"
          placeholder="ex: 0.85"
          value={form.waistHipRatio}
          onChange={(e) => handleChange('waistHipRatio', e.target.value)}
        />

        <Input
          label="% Gordura corporal"
          type="number"
          name="bodyFatPercent"
          min="0"
          max="100"
          step="0.1"
          placeholder="ex: 22.5"
          value={form.bodyFatPercent}
          onChange={(e) => handleChange('bodyFatPercent', e.target.value)}
        />
        <Input
          label="Pressão sistólica (mmHg)"
          type="number"
          name="bloodPressureSystolic"
          min="0"
          step="1"
          placeholder="ex: 120"
          value={form.bloodPressureSystolic}
          onChange={(e) => handleChange('bloodPressureSystolic', e.target.value)}
        />
        <Input
          label="Pressão diastólica (mmHg)"
          type="number"
          name="bloodPressureDiastolic"
          min="0"
          step="1"
          placeholder="ex: 80"
          value={form.bloodPressureDiastolic}
          onChange={(e) => handleChange('bloodPressureDiastolic', e.target.value)}
        />

        <Input
          label="Frequência cardíaca (bpm)"
          type="number"
          name="heartRateBpm"
          min="0"
          step="1"
          placeholder="ex: 72"
          value={form.heartRateBpm}
          onChange={(e) => handleChange('heartRateBpm', e.target.value)}
        />

        {/* Notes full width */}
        <div className="sm:col-span-2 lg:col-span-3">
          <label
            htmlFor="evo-notes"
            className="mb-1.5 block text-body-sm font-medium text-content-muted"
          >
            Observações
          </label>
          <textarea
            id="evo-notes"
            name="notes"
            rows={3}
            placeholder="Notas adicionais..."
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            className="min-h-[88px] w-full rounded-input border border-border bg-surface px-3 py-2.5 text-body text-content placeholder-content-subtle transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button type="submit" loading={submitting} disabled={submitting}>
          Salvar evolução
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function PatientEvolutionPage() {
  const { id } = useParams<{ id: string }>();

  const [patient, setPatient] = useState<PatientWithCount | null>(null);
  const [evolutions, setEvolutions] = useState<PatientEvolution[]>([]);
  const [loadingPatient, setLoadingPatient] = useState(true);
  const [loadingEvolutions, setLoadingEvolutions] = useState(true);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const loadEvolutions = useCallback(() => {
    if (!id) return;
    setLoadingEvolutions(true);
    listEvolutions(id)
      .then((res) => {
        // Sort by recordedAt descending
        const sorted = [...res.data].sort(
          (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
        );
        setEvolutions(sorted);
      })
      .catch(() => setEvolutions([]))
      .finally(() => setLoadingEvolutions(false));
  }, [id]);

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
    loadEvolutions();
  }, [loadEvolutions]);

  function handleSaved() {
    setShowForm(false);
    loadEvolutions();
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

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-heading font-semibold text-content">{patient.fullName}</h2>
          <p className="mt-0.5 text-body-sm text-content-muted">Histórico de evolução</p>
        </div>
        <Button
          variant={showForm ? 'secondary' : 'primary'}
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Fechar formulário' : 'Adicionar registro'}
        </Button>
      </div>

      {/* ── Inline add form ── */}
      {showForm && (
        <Card title="Novo registro de evolução" padding="md">
          <AddEvolutionForm
            patientId={id}
            onSaved={handleSaved}
            onCancel={() => setShowForm(false)}
          />
        </Card>
      )}

      {/* ── Evolution table ── */}
      <Card title="Registros de evolução" padding="none">
        {loadingEvolutions ? (
          <div className="flex justify-center py-10">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : evolutions.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-body text-content-muted">Nenhum registro de evolução ainda.</p>
            <p className="mt-1 text-body-sm text-content-subtle">
              Use o botão "Adicionar registro" para inserir o primeiro.
            </p>
            {!showForm && (
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                Adicionar registro
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-body-sm">
              <thead>
                <tr className="border-b border-border-muted bg-surface-muted">
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-content-muted">
                    Data
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-content-muted">
                    Peso (kg)
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-content-muted">
                    IMC
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-content-muted">
                    Cintura (cm)
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-content-muted">
                    Quadril (cm)
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-content-muted">
                    %Gordura
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-content-muted">
                    PA (Sis/Dia)
                  </th>
                  <th className="whitespace-nowrap px-4 py-3 font-medium text-content-muted">
                    FC (bpm)
                  </th>
                </tr>
              </thead>
              <tbody>
                {evolutions.map((evo) => {
                  const sys = evo.bloodPressureSystolic;
                  const dia = evo.bloodPressureDiastolic;
                  const paDisplay =
                    sys !== null && dia !== null ? `${sys}/${dia}` : sys !== null ? `${sys}/—` : dia !== null ? `—/${dia}` : '—';

                  return (
                    <tr
                      key={evo.id}
                      className="border-b border-border-muted transition-calm last:border-0 hover:bg-surface-muted"
                    >
                      <td className="whitespace-nowrap px-4 py-3 text-content-muted">
                        {formatDateTime(evo.recordedAt)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-content">
                        {fmt(evo.weightKg)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-content">
                        {fmt(evo.bmi)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-content">
                        {fmt(evo.waistCm)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-content">
                        {fmt(evo.hipCm)}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-content">
                        {fmt(evo.bodyFatPercent)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums text-content">
                        {paDisplay}
                      </td>
                      <td className="px-4 py-3 tabular-nums text-content">
                        {fmt(evo.heartRateBpm)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {evolutions.length > 0 && (
          <div className="border-t border-border-muted px-4 py-2.5">
            <p className="text-body-sm text-content-subtle">
              {evolutions.length} registro{evolutions.length !== 1 ? 's' : ''} · ordenados do
              mais recente ao mais antigo
            </p>
          </div>
        )}
      </Card>

      {/* ── Back ── */}
      <div className="pt-2">
        <Link to={`/patients/${id}`}>
          <Button variant="secondary">Voltar ao paciente</Button>
        </Link>
      </div>
    </div>
  );
}
