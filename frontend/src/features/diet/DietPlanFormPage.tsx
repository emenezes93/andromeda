import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createDietPlan, updateDietPlan, getDietPlan } from '@/api/diet';
import { listPatients } from '@/api/patients';
import { getSession } from '@/api/sessions';
import type { CreateDietPlanBody } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';
import { track } from '@/lib/analytics';

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

const RESTRICTIONS = [
  { id: 'sem_gluten', label: '🌾 Sem glúten' },
  { id: 'sem_lactose', label: '🥛 Sem lactose' },
  { id: 'vegetariano', label: '🥦 Vegetariano' },
  { id: 'vegano', label: '🌱 Vegano' },
  { id: 'low_carb', label: '🍖 Low Carb' },
  { id: 'sem_acucar', label: '🍬 Sem açúcar' },
];

interface FormState {
  patientId: string;
  name: string;
  description: string;
  caloriesKcal: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  waterMl: string;
  restrictions: string[];
  basedOnSessionId: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

const emptyForm: FormState = {
  patientId: '',
  name: '',
  description: '',
  caloriesKcal: '',
  proteinG: '',
  carbsG: '',
  fatG: '',
  waterMl: '',
  restrictions: [],
  basedOnSessionId: '',
  startDate: todayISO(),
  endDate: '',
  active: true,
};

export function DietPlanFormPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const isEditing = !!id;
  const sourceSessionId = searchParams.get('sessionId') ?? '';

  const [form, setForm] = useState<FormState>({
    ...emptyForm,
    patientId: searchParams.get('patientId') ?? '',
    basedOnSessionId: sourceSessionId,
  });
  const [isDirty, setIsDirty] = useState(false);
  const { showConfirmModal, confirmLeave, cancelLeave, message } = useUnsavedChanges(isDirty);
  const [sourceSessionLabel, setSourceSessionLabel] = useState<string | null>(null);

  // Buscar plano existente em modo edição
  const { data: existing } = useQuery({
    queryKey: ['diet-plan', id],
    queryFn: () => getDietPlan(id!),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existing) {
      setForm({
        patientId: existing.patientId,
        name: existing.name,
        description: existing.description ?? '',
        caloriesKcal: existing.caloriesKcal?.toString() ?? '',
        proteinG: existing.proteinG?.toString() ?? '',
        carbsG: existing.carbsG?.toString() ?? '',
        fatG: existing.fatG?.toString() ?? '',
        waterMl: existing.waterMl?.toString() ?? '',
        restrictions: existing.restrictions ?? [],
        basedOnSessionId: existing.basedOnSessionId ?? '',
        startDate: existing.startDate.split('T')[0],
        endDate: existing.endDate?.split('T')[0] ?? '',
        active: existing.active,
      });
    }
  }, [existing]);

  useEffect(() => {
    if (isEditing || !sourceSessionId) return;
    getSession(sourceSessionId)
      .then((session) => {
        const labelParts = [session.patient?.fullName, session.template?.name].filter(Boolean);
        setSourceSessionLabel(labelParts.length > 0 ? labelParts.join(' • ') : null);
        setForm((current) => ({
          ...current,
          patientId: current.patientId || session.patientId || '',
          basedOnSessionId: current.basedOnSessionId || sourceSessionId,
          name: current.name || (session.patient?.fullName ? `Plano alimentar - ${session.patient.fullName}` : 'Plano alimentar'),
          description:
            current.description ||
            `Plano alimentar criado a partir da avaliação ${session.template?.name ?? 'mais recente'}${session.patient?.fullName ? ` de ${session.patient.fullName}` : ''}.`,
        }));
      })
      .catch(() => setSourceSessionLabel(null));
  }, [isEditing, sourceSessionId]);

  // Alunos para select
  const { data: patientsData } = useQuery({
    queryKey: ['patients-select'],
    queryFn: () => listPatients({ limit: 100 }),
  });

  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (body: CreateDietPlanBody) =>
      isEditing ? updateDietPlan(id!, body) : createDietPlan(body),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['diet-plans'] });
      queryClient.invalidateQueries({ queryKey: ['diet-plan', data.id] });
      setIsDirty(false);
      if (!isEditing) track({ name: 'diet_plan_created', planId: data.id, patientId: data.patientId });
      toast.success(isEditing ? 'Plano atualizado!' : 'Plano criado!');
      navigate(`/diet-plans/${data.id}`);
    },
    onError: () => {
      toast.error('Erro ao salvar plano.');
    },
  });

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setIsDirty(true);
  }

  function toggleRestriction(id: string) {
    setForm((f) => ({
      ...f,
      restrictions: f.restrictions.includes(id)
        ? f.restrictions.filter((r) => r !== id)
        : [...f.restrictions, id],
    }));
    setIsDirty(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.patientId) {
      toast.error('Selecione um aluno.');
      return;
    }
    if (!form.name.trim()) {
      toast.error('Informe o nome do plano.');
      return;
    }
    mutation.mutate({
      patientId: form.patientId,
      name: form.name,
      description: form.description || undefined,
      caloriesKcal: form.caloriesKcal ? parseInt(form.caloriesKcal) : undefined,
      proteinG: form.proteinG ? parseFloat(form.proteinG) : undefined,
      carbsG: form.carbsG ? parseFloat(form.carbsG) : undefined,
      fatG: form.fatG ? parseFloat(form.fatG) : undefined,
      waterMl: form.waterMl ? parseInt(form.waterMl) : undefined,
      restrictions: form.restrictions,
      basedOnSessionId: form.basedOnSessionId || undefined,
      startDate: form.startDate,
      endDate: form.endDate || undefined,
      active: form.active,
    });
  }

  const patients = patientsData?.data ?? [];

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      {!isEditing && sourceSessionId && (
        <Card padding="md" className="border border-primary/20 bg-primary-subtle/30">
          <h2 className="text-body font-semibold text-content">Plano com base em avaliação</h2>
          <p className="mt-1 text-body-sm text-content-muted">
            {sourceSessionLabel
              ? `Você está criando este plano a partir da avaliação ${sourceSessionLabel}.`
              : 'Você está criando este plano a partir de uma avaliação recente do aluno.'}
          </p>
          <p className="mt-2 text-body-sm text-content-muted">
            O aluno, o vínculo da avaliação e a descrição inicial já foram sugeridos.
          </p>
        </Card>
      )}

      {/* Aluno + Nome */}
      <Card padding="md">
        <h2 className="mb-4 text-body font-semibold text-content">Informações Básicas</h2>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-body-sm font-medium text-content">
              Aluno <span className="text-error">*</span>
            </label>
            <select
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-content focus:border-primary focus:outline-none"
              value={form.patientId}
              onChange={(e) => update('patientId', e.target.value)}
              disabled={isEditing}
            >
              <option value="">Selecione um aluno…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.fullName}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-body-sm font-medium text-content">
              Nome do Plano <span className="text-error">*</span>
            </label>
            <Input
              placeholder="Ex: Plano de Emagrecimento Fase 1"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-body-sm font-medium text-content">Descrição</label>
            <textarea
              className="w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-content focus:border-primary focus:outline-none"
              rows={3}
              placeholder="Observações sobre o plano..."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Metas diárias */}
      <Card padding="md">
        <h2 className="mb-2 text-body font-semibold text-content">Metas Diárias</h2>
        <p className="mb-4 text-body-sm text-content-muted">
          Defina os objetivos nutricionais diários do aluno.
        </p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-body-sm font-medium text-content">
              🔥 Calorias (kcal)
            </label>
            <Input
              type="number"
              placeholder="Ex: 2000"
              value={form.caloriesKcal}
              onChange={(e) => update('caloriesKcal', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-body-sm font-medium text-content">
              💪 Proteínas (g)
            </label>
            <Input
              type="number"
              placeholder="Ex: 150"
              value={form.proteinG}
              onChange={(e) => update('proteinG', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-body-sm font-medium text-content">
              🌾 Carboidratos (g)
            </label>
            <Input
              type="number"
              placeholder="Ex: 200"
              value={form.carbsG}
              onChange={(e) => update('carbsG', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-body-sm font-medium text-content">
              🥑 Gorduras (g)
            </label>
            <Input
              type="number"
              placeholder="Ex: 65"
              value={form.fatG}
              onChange={(e) => update('fatG', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1 block text-body-sm font-medium text-content">
              💧 Água (ml)
            </label>
            <Input
              type="number"
              placeholder="Ex: 2500"
              value={form.waterMl}
              onChange={(e) => update('waterMl', e.target.value)}
            />
          </div>
        </div>

        {/* Dica de distribuição */}
        {form.caloriesKcal && form.proteinG && form.carbsG && form.fatG && (
          <div className="mt-4 rounded-lg border border-primary/20 bg-primary-subtle p-3 text-body-sm text-primary">
            💡 Distribuição: Proteína{' '}
            {Math.round((parseFloat(form.proteinG) * 4 / parseInt(form.caloriesKcal)) * 100)}% •
            Carbos {Math.round((parseFloat(form.carbsG) * 4 / parseInt(form.caloriesKcal)) * 100)}% •
            Gordura {Math.round((parseFloat(form.fatG) * 9 / parseInt(form.caloriesKcal)) * 100)}%
          </div>
        )}
      </Card>

      {/* Restrições alimentares */}
      <Card padding="md">
        <h2 className="mb-3 text-body font-semibold text-content">Restrições Alimentares</h2>
        <div className="flex flex-wrap gap-2">
          {RESTRICTIONS.map((r) => {
            const active = form.restrictions.includes(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggleRestriction(r.id)}
                className={`rounded-button border px-3 py-1.5 text-body-sm font-medium transition-calm ${
                  active
                    ? 'border-primary bg-primary-subtle text-primary'
                    : 'border-border bg-surface text-content-muted hover:border-primary/40 hover:text-content'
                }`}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Datas + Status */}
      <Card padding="md">
        <h2 className="mb-4 text-body font-semibold text-content">Período do Plano</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-body-sm font-medium text-content">
              Data de Início <span className="text-error">*</span>
            </label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => update('startDate', e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-body-sm font-medium text-content">
              Data de Término
            </label>
            <Input
              type="date"
              value={form.endDate}
              onChange={(e) => update('endDate', e.target.value)}
              min={form.startDate}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="checkbox"
            id="active"
            checked={form.active}
            onChange={(e) => update('active', e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <label htmlFor="active" className="text-body-sm text-content">
            Plano ativo
          </label>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando…' : isEditing ? 'Salvar Alterações' : 'Criar Plano'}
        </Button>
        <Link to="/diet-plans">
          <Button variant="secondary" type="button">Cancelar</Button>
        </Link>
      </div>
    </form>
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
