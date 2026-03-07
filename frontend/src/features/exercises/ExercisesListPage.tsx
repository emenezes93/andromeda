import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listExercises, deleteExercise } from '@/api/exercises';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { SkeletonCardGrid } from '@/components/ui/SkeletonCard';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ExerciseFormModal } from './ExerciseFormModal';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/components/ui/Toast';
import type { Exercise } from '@/types';

const MUSCLE_GROUP_OPTIONS: SelectOption[] = [
  { value: '', label: 'Todos' },
  { value: 'chest', label: 'Peito' },
  { value: 'back', label: 'Costas' },
  { value: 'shoulders', label: 'Ombros' },
  { value: 'arms', label: 'Braços' },
  { value: 'legs', label: 'Pernas' },
  { value: 'core', label: 'Core' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'other', label: 'Outro' },
];

function ExerciseRow({
  exercise,
  onEdit,
  onDelete,
  t,
}: {
  exercise: Exercise;
  onEdit: (e: Exercise) => void;
  onDelete: (e: Exercise) => void;
  t: ReturnType<typeof useTranslation>['t'];
}) {
  const muscleLabel = MUSCLE_GROUP_OPTIONS.find((o) => o.value === exercise.muscleGroup)?.label ?? exercise.muscleGroup;
  return (
    <tr className="border-b border-border-muted last:border-0">
      <td className="py-3 pr-3">
        <p className="font-medium text-content">{exercise.name}</p>
        <p className="text-body-sm text-content-muted">{muscleLabel}</p>
      </td>
      <td className="py-3 pr-3 text-body-sm text-content-muted">
        {exercise.equipment ?? '—'}
      </td>
      <td className="py-3 pr-3">
        {exercise.isGlobal && (
          <Badge variant="default">{t.exercises.global}</Badge>
        )}
      </td>
      <td className="py-3 text-right">
        {!exercise.isGlobal && (
          <>
            <Button variant="ghost" size="sm" onClick={() => onEdit(exercise)}>
              {t.exercises.edit}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(exercise)}>
              {t.exercises.delete}
            </Button>
          </>
        )}
      </td>
    </tr>
  );
}

export function ExercisesListPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<string>('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Exercise | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['exercises', page, muscleGroup || undefined, search || undefined],
    queryFn: () =>
      listExercises({
        page,
        limit: 20,
        muscleGroup: muscleGroup || undefined,
        search: search || undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exercises'] });
      toast.success(t.exercises.deleteSuccess);
      setDeleteTarget(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleEdit = (exercise: Exercise) => {
    setEditing(exercise);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditing(null);
  };

  const handleCreateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['exercises'] });
    toast.success(t.exercises.createSuccess);
    handleCloseForm();
  };

  const handleUpdateSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['exercises'] });
    toast.success(t.exercises.updateSuccess);
    handleCloseForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-content-muted">{t.exercises.subtitle}</p>
        <Button variant="primary" onClick={() => { setEditing(null); setFormOpen(true); }}>
          + {t.exercises.newExercise}
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          placeholder={t.exercises.search}
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="sm:max-w-xs"
        />
        <Select
          options={MUSCLE_GROUP_OPTIONS}
          value={muscleGroup}
          onChange={(e) => { setMuscleGroup(e.target.value); setPage(1); }}
          className="w-full sm:w-40"
        />
      </div>

      {isLoading ? (
        <SkeletonCardGrid count={5} />
      ) : (
        <Card padding="none">
          {data?.data.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border-muted bg-surface-muted/50">
                    <th className="px-4 py-3 text-body-sm font-semibold text-content-muted">{t.exercises.name}</th>
                    <th className="px-4 py-3 text-body-sm font-semibold text-content-muted">{t.exercises.equipment}</th>
                    <th className="px-4 py-3 text-body-sm font-semibold text-content-muted">{t.exercises.global}</th>
                    <th className="px-4 py-3 text-right text-body-sm font-semibold text-content-muted" />
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((exercise) => (
                    <ExerciseRow
                      key={exercise.id}
                      exercise={exercise}
                      onEdit={handleEdit}
                      onDelete={setDeleteTarget}
                      t={t}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-4 py-8 text-center text-content-muted">
              Nenhum exercício encontrado. Crie um ou use a busca com outros filtros.
            </div>
          )}
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex justify-center gap-2 border-t border-border-muted px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="flex items-center px-2 text-body-sm text-content-muted">
                {data.meta.page} / {data.meta.totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={!data.meta.hasMore}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </Card>
      )}

      <ExerciseFormModal
        open={formOpen}
        exercise={editing}
        onClose={handleCloseForm}
        onCreated={handleCreateSuccess}
        onUpdated={handleUpdateSuccess}
      />

      <ConfirmModal
        open={!!deleteTarget}
        title={t.exercises.delete}
        message={t.exercises.deleteConfirm}
        variant="danger"
        loading={deleteMutation.isPending}
        confirmLabel={t.exercises.delete}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
