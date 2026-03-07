import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDietPlan, listDietEntries, deleteDietPlan, createDietEntry, deleteDietEntry } from '@/api/diet';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/Toast';
import type { DietFood, MealType } from '@/types';

const MEAL_LABELS: Record<string, string> = {
  breakfast: '☀️ Café da Manhã',
  lunch: '🥗 Almoço',
  dinner: '🌙 Jantar',
  snack: '🍎 Lanche',
  other: '🍽️ Outro',
};

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'other'];

interface AddEntryState {
  entryDate: string;
  mealType: MealType;
  notes: string;
  foods: DietFood[];
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function MacroChip({ label, value, unit, color }: { label: string; value: number | null; unit: string; color: string }) {
  if (value == null) return null;
  return (
    <div className={`flex flex-col items-center rounded-xl border px-3 py-2 ${color}`}>
      <span className="text-xs text-inherit/70">{label}</span>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs opacity-70">{unit}</span>
    </div>
  );
}

export function DietPlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const toast = useToast();

  const [showAddEntry, setShowAddEntry] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<'plan' | { entryId: string } | null>(null);
  const [entryForm, setEntryForm] = useState<AddEntryState>({
    entryDate: today(),
    mealType: 'lunch',
    notes: '',
    foods: [{ name: '', quantity: 100, unit: 'g', caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }],
  });
  const [fromDate, setFromDate] = useState('');

  const { data: plan, isLoading: loadingPlan } = useQuery({
    queryKey: ['diet-plan', id],
    queryFn: () => getDietPlan(id!),
    enabled: !!id,
  });

  const { data: entriesData, isLoading: loadingEntries } = useQuery({
    queryKey: ['diet-entries', id, fromDate],
    queryFn: () => listDietEntries({ dietPlanId: id!, from: fromDate || undefined, limit: 50 }),
    enabled: !!id,
  });

  const deletePlanMutation = useMutation({
    mutationFn: () => deleteDietPlan(id!),
    onSuccess: () => {
      toast.success('Plano removido.');
      navigate('/diet-plans');
    },
    onError: () => toast.error('Erro ao remover plano.'),
  });

  const addEntryMutation = useMutation({
    mutationFn: () =>
      createDietEntry({
        patientId: plan!.patientId,
        dietPlanId: id,
        entryDate: entryForm.entryDate,
        mealType: entryForm.mealType,
        foodsJson: entryForm.foods.filter((f) => f.name.trim()),
        notes: entryForm.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diet-entries', id] });
      qc.invalidateQueries({ queryKey: ['diet-stats', plan?.patientId] });
      setShowAddEntry(false);
      setEntryForm({ entryDate: today(), mealType: 'lunch', notes: '', foods: [{ name: '', quantity: 100, unit: 'g', caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }] });
      toast.success('Refeição registrada!');
    },
    onError: () => toast.error('Erro ao registrar refeição.'),
  });

  const deleteEntryMutation = useMutation({
    mutationFn: (entryId: string) => deleteDietEntry(entryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['diet-entries', id] });
      qc.invalidateQueries({ queryKey: ['diet-stats', plan?.patientId] });
      toast.success('Entrada removida.');
    },
    onError: () => toast.error('Erro ao remover entrada.'),
  });

  function updateFood(i: number, field: keyof DietFood, value: string | number) {
    setEntryForm((f) => {
      const foods = [...f.foods];
      foods[i] = { ...foods[i], [field]: value };
      return { ...f, foods };
    });
  }

  function addFoodRow() {
    setEntryForm((f) => ({
      ...f,
      foods: [...f.foods, { name: '', quantity: 100, unit: 'g', caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }],
    }));
  }

  function removeFoodRow(i: number) {
    setEntryForm((f) => ({ ...f, foods: f.foods.filter((_, idx) => idx !== i) }));
  }

  if (loadingPlan) return <Skeleton className="h-64 w-full rounded-card" />;
  if (!plan) return <p className="text-error">Plano não encontrado.</p>;

  const entries = entriesData?.data ?? [];

  // Agrupar entradas por data
  const byDate = entries.reduce<Record<string, typeof entries>>((acc, e) => {
    const d = e.entryDate.split('T')[0];
    (acc[d] = acc[d] ?? []).push(e);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-heading font-bold text-content">{plan.name}</h1>
            <Badge variant={plan.active ? 'success' : 'default'}>{plan.active ? 'Ativo' : 'Inativo'}</Badge>
          </div>
          <p className="mt-1 text-body-sm text-content-muted">
            Paciente:{' '}
            <Link to={`/patients/${plan.patientId}`} className="text-primary hover:underline">
              {plan.patientName}
            </Link>
          </p>
          <p className="text-body-sm text-content-muted">
            📅 {new Date(plan.startDate).toLocaleDateString('pt-BR')}
            {plan.endDate && ` → ${new Date(plan.endDate).toLocaleDateString('pt-BR')}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/diet-dashboard/${plan.patientId}`}>
            <Button variant="secondary">📊 Ver Dashboard</Button>
          </Link>
          <Link to={`/diet-plans/${id}/edit`}>
            <Button variant="secondary">Editar</Button>
          </Link>
          <Button
            variant="outline"
            onClick={() => setPendingDelete('plan')}
          >
            Remover
          </Button>
        </div>
      </div>

      {/* Metas diárias */}
      <Card padding="md">
        <h2 className="mb-3 text-body font-semibold text-content">Metas Diárias</h2>
        <div className="flex flex-wrap gap-3">
          <MacroChip label="Calorias" value={plan.caloriesKcal} unit="kcal" color="border-primary/30 bg-primary-subtle text-primary" />
          <MacroChip label="Proteínas" value={plan.proteinG} unit="g" color="border-success/30 bg-success-light text-success" />
          <MacroChip label="Carboidratos" value={plan.carbsG} unit="g" color="border-warning/30 bg-warning-light text-warning" />
          <MacroChip label="Gorduras" value={plan.fatG} unit="g" color="border-warning/30 bg-warning-light text-warning" />
          <MacroChip label="Água" value={plan.waterMl} unit="ml" color="border-info/30 bg-info-light text-info" />
        </div>

        {plan.restrictions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {plan.restrictions.map((r) => (
              <Badge key={r} variant="warning">{r}</Badge>
            ))}
          </div>
        )}

        {plan.description && (
          <p className="mt-3 text-body-sm text-content-muted">{plan.description}</p>
        )}
      </Card>

      {/* Diário Alimentar */}
      <div>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-body font-semibold text-content">
            Diário Alimentar ({entries.length} entradas)
          </h2>
          <div className="flex items-center gap-3">
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-auto"
              placeholder="Filtrar por data"
            />
            <Button variant="primary" onClick={() => setShowAddEntry((v) => !v)}>
              {showAddEntry ? 'Cancelar' : '+ Registrar Refeição'}
            </Button>
          </div>
        </div>

        {/* Form de nova entrada */}
        {showAddEntry && (
          <Card padding="md" className="mb-4 border border-primary/20">
            <h3 className="mb-4 text-body-sm font-semibold text-content">Nova Refeição</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-content-muted">Data</label>
                <Input type="date" value={entryForm.entryDate} onChange={(e) => setEntryForm((f) => ({ ...f, entryDate: e.target.value }))} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-content-muted">Refeição</label>
                <select
                  className="w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-content focus:border-primary focus:outline-none"
                  value={entryForm.mealType}
                  onChange={(e) => setEntryForm((f) => ({ ...f, mealType: e.target.value as MealType }))}
                >
                  {MEAL_TYPES.map((m) => <option key={m} value={m}>{MEAL_LABELS[m]}</option>)}
                </select>
              </div>
            </div>

            {/* Alimentos */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-content-muted">Alimentos</p>
              {entryForm.foods.map((food, i) => (
                <div key={i} className="grid grid-cols-2 gap-2 rounded-lg border border-border p-2 sm:grid-cols-4 lg:grid-cols-7">
                  <div className="col-span-2 sm:col-span-4 lg:col-span-2">
                    <Input placeholder="Nome do alimento" value={food.name} onChange={(e) => updateFood(i, 'name', e.target.value)} />
                  </div>
                  <div>
                    <Input type="number" placeholder="Qtd" value={food.quantity} onChange={(e) => updateFood(i, 'quantity', parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <Input placeholder="Un." value={food.unit} onChange={(e) => updateFood(i, 'unit', e.target.value)} />
                  </div>
                  <div>
                    <Input type="number" placeholder="kcal" value={food.caloriesKcal} onChange={(e) => updateFood(i, 'caloriesKcal', parseFloat(e.target.value))} />
                  </div>
                  <div>
                    <Input type="number" placeholder="Prot (g)" value={food.proteinG} onChange={(e) => updateFood(i, 'proteinG', parseFloat(e.target.value))} />
                  </div>
                  <div className="flex items-center gap-1">
                    <Input type="number" placeholder="Carb (g)" value={food.carbsG} onChange={(e) => updateFood(i, 'carbsG', parseFloat(e.target.value))} />
                    {entryForm.foods.length > 1 && (
                      <button type="button" onClick={() => removeFoodRow(i)} className="flex-shrink-0 rounded p-1 text-error hover:bg-error-light">✕</button>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addFoodRow} className="text-body-sm text-primary hover:underline">
                + Adicionar alimento
              </button>
            </div>

            <div className="mt-3">
              <Input placeholder="Observações (opcional)" value={entryForm.notes} onChange={(e) => setEntryForm((f) => ({ ...f, notes: e.target.value }))} />
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="primary" onClick={() => addEntryMutation.mutate()} disabled={addEntryMutation.isPending}>
                {addEntryMutation.isPending ? 'Salvando…' : 'Salvar Refeição'}
              </Button>
              <Button variant="secondary" onClick={() => setShowAddEntry(false)}>Cancelar</Button>
            </div>
          </Card>
        )}

        {/* Lista de entradas */}
        {loadingEntries ? (
          <Skeleton className="h-32 w-full rounded-card" />
        ) : entries.length === 0 ? (
          <Card padding="md">
            <p className="text-center text-content-muted">Nenhuma refeição registrada ainda.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {Object.entries(byDate)
              .sort(([a], [b]) => b.localeCompare(a))
              .map(([date, dayEntries]) => (
                <div key={date}>
                  <p className="mb-2 text-body-sm font-semibold text-content-muted">
                    📅 {new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
                    {' '}— {dayEntries.reduce((s, e) => s + (e.totalCalories ?? 0), 0)} kcal total
                  </p>
                  <div className="space-y-2">
                    {dayEntries.map((entry) => (
                      <Card key={entry.id} padding="sm">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="font-medium text-content">
                              {MEAL_LABELS[entry.mealType] ?? entry.mealType}
                            </p>
                            <p className="text-body-sm text-content-muted">
                              {(entry.foodsJson as Array<{name: string}>).map((f) => f.name).filter(Boolean).join(', ')}
                            </p>
                            {entry.notes && (
                              <p className="mt-1 text-xs text-content-subtle italic">{entry.notes}</p>
                            )}
                          </div>
                          <div className="flex items-start gap-3 text-right">
                            <div className="text-body-sm">
                              {entry.totalCalories != null && (
                                <p className="font-bold text-content">{entry.totalCalories} kcal</p>
                              )}
                              {entry.totalProteinG != null && (
                                <p className="text-xs text-content-muted">P:{Math.round(entry.totalProteinG)}g C:{Math.round(entry.totalCarbsG ?? 0)}g G:{Math.round(entry.totalFatG ?? 0)}g</p>
                              )}
                            </div>
                            <button
                              onClick={() => setPendingDelete({ entryId: entry.id })}
                              className="rounded p-1 text-content-muted hover:bg-error-light hover:text-error"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={pendingDelete !== null}
        title={pendingDelete === 'plan' ? 'Remover plano de dieta' : 'Remover entrada'}
        message={
          pendingDelete === 'plan'
            ? 'Remover este plano de dieta? Esta ação não pode ser desfeita.'
            : pendingDelete
              ? 'Remover esta entrada do diário alimentar?'
              : ''
        }
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        variant="danger"
        loading={pendingDelete === 'plan' ? deletePlanMutation.isPending : !!(pendingDelete && deleteEntryMutation.isPending)}
        onConfirm={() => {
          if (pendingDelete === 'plan') {
            deletePlanMutation.mutate();
            setPendingDelete(null);
          } else if (pendingDelete && 'entryId' in pendingDelete) {
            deleteEntryMutation.mutate(pendingDelete.entryId);
            setPendingDelete(null);
          }
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
