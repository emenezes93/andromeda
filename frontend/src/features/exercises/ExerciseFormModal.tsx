import { useState, useEffect } from 'react';
import { Dialog, DialogTitle, TransitionChild } from '@headlessui/react';
import { createExercise, updateExercise } from '@/api/exercises';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { useTranslation } from '@/hooks/useTranslation';
import type { Exercise, ExerciseMuscleGroup, ExerciseEquipment } from '@/types';

const MUSCLE_GROUP_OPTIONS: SelectOption[] = [
  { value: 'chest', label: 'Peito' },
  { value: 'back', label: 'Costas' },
  { value: 'shoulders', label: 'Ombros' },
  { value: 'arms', label: 'Braços' },
  { value: 'legs', label: 'Pernas' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'other', label: 'Outro' },
];

const EQUIPMENT_OPTIONS: SelectOption[] = [
  { value: '', label: '—' },
  { value: 'barbell', label: 'Barra' },
  { value: 'dumbbell', label: 'Halter' },
  { value: 'cable', label: 'Cabo' },
  { value: 'machine', label: 'Máquina' },
  { value: 'bodyweight', label: 'Peso do corpo' },
  { value: 'band', label: 'Elástico' },
  { value: 'other', label: 'Outro' },
];

export interface ExerciseFormModalProps {
  open: boolean;
  exercise: Exercise | null;
  onClose: () => void;
  onCreated: () => void;
  onUpdated: () => void;
}

export function ExerciseFormModal({
  open,
  exercise,
  onClose,
  onCreated,
  onUpdated,
}: ExerciseFormModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<ExerciseMuscleGroup>('other');
  const [equipment, setEquipment] = useState<string>('');
  const [videoUrl, setVideoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!exercise;

  useEffect(() => {
    if (open) {
      setName(exercise?.name ?? '');
      setMuscleGroup((exercise?.muscleGroup as ExerciseMuscleGroup) ?? 'other');
      setEquipment(exercise?.equipment ?? '');
      setVideoUrl(exercise?.videoUrl ?? '');
      setError(null);
    }
  }, [open, exercise]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await updateExercise(exercise.id, {
          name: name.trim(),
          muscleGroup,
          equipment: equipment ? (equipment as ExerciseEquipment) : null,
          videoUrl: videoUrl.trim() || null,
        });
        onUpdated();
      } else {
        await createExercise({
          name: name.trim(),
          muscleGroup,
          equipment: equipment ? (equipment as ExerciseEquipment) : undefined,
          videoUrl: videoUrl.trim() || undefined,
        });
        onCreated();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open={open}
      as="div"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClose={() => !loading && onClose()}
    >
      <TransitionChild
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden />
      </TransitionChild>
      <TransitionChild
        enter="ease-out duration-200"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <div className="fixed flex w-full max-w-md flex-col rounded-card border border-border bg-surface shadow-lg">
        <DialogTitle className="sr-only">
          {isEdit ? t.exercises.edit : t.exercises.newExercise}
        </DialogTitle>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-6">
          <h2 className="text-heading-md font-semibold text-content">
            {isEdit ? t.exercises.edit : t.exercises.newExercise}
          </h2>

          <Input
            label={t.exercises.name}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />

          <Select
            label={t.exercises.muscleGroup}
            options={MUSCLE_GROUP_OPTIONS}
            value={muscleGroup}
            onChange={(e) => setMuscleGroup(e.target.value as ExerciseMuscleGroup)}
          />

          <Select
            label={t.exercises.equipment}
            options={EQUIPMENT_OPTIONS}
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          />

          <Input
            label={t.exercises.videoUrl}
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://..."
          />

          {error && (
            <p className="text-body-sm text-error" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              {isEdit ? 'Salvar' : 'Criar'}
            </Button>
          </div>
        </form>
        </div>
      </TransitionChild>
    </Dialog>
  );
}
