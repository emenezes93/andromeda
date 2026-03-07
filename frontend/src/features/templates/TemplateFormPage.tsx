import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { createTemplate } from '@/api/templates';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useUnsavedChanges } from '@/hooks/useUnsavedChanges';

const QUESTION_TYPES = ['text', 'number', 'single', 'multiple', 'sentiment'] as const;
type QuestionType = (typeof QUESTION_TYPES)[number];

const questionSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Enunciado é obrigatório'),
  type: z.enum(QUESTION_TYPES),
  required: z.boolean(),
  options: z.string(),
  tags: z.string(),
});

const templateSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  questions: z.array(questionSchema).min(1, 'Adicione pelo menos uma pergunta'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

function buildSchemaJson(questions: TemplateFormData['questions']) {
  return {
    questions: questions.map((q) => ({
      id: q.id.trim() || `q${Math.random().toString(36).slice(2, 8)}`,
      text: q.text.trim(),
      type: q.type,
      required: q.required,
      ...(q.options.trim() && (q.type === 'single' || q.type === 'multiple')
        ? { options: q.options.split(',').map((o) => o.trim()).filter(Boolean) }
        : {}),
      ...(q.tags.trim()
        ? { tags: q.tags.split(',').map((t) => t.trim()).filter(Boolean) }
        : {}),
    })),
  };
}

const typeLabels: Record<QuestionType, string> = {
  text: 'Texto livre',
  number: 'Número',
  single: 'Escolha única',
  multiple: 'Múltipla escolha',
  sentiment: 'Sentimento (barra com emojis)',
};

const defaultQuestion = (index: number): TemplateFormData['questions'][0] => ({
  id: `q${index + 1}`,
  text: '',
  type: 'text',
  required: true,
  options: '',
  tags: '',
});

export function TemplateFormPage() {
  const navigate = useNavigate();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    defaultValues: {
      name: '',
      questions: [defaultQuestion(0)],
    },
  });

  const { fields, append, remove, move } = useFieldArray({
    control,
    name: 'questions',
  });

  const { showConfirmModal, confirmLeave, cancelLeave, message } = useUnsavedChanges(isDirty);

  const onSubmit = async (data: TemplateFormData) => {
    const schemaJson = buildSchemaJson(data.questions);
    try {
      const t = await createTemplate({ name: data.name.trim(), schemaJson });
      navigate(`/templates/${t.id}`);
    } catch (err) {
      setError('root', {
        message: err instanceof Error ? err.message : 'Erro ao criar template',
      });
    }
  };

  const addQuestion = () => append(defaultQuestion(fields.length));

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card title="Novo template">
          <Input
            label="Nome do template"
            {...register('name')}
            placeholder="Ex: Anamnese inicial"
            error={errors.name?.message}
          />
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-body font-semibold text-content">
              Perguntas{' '}
              <span className="ml-1 rounded-full bg-primary-subtle px-2 py-0.5 text-body-sm font-medium text-primary">
                {fields.length}
              </span>
            </h2>
          </div>

          {(errors.questions as { message?: string } | undefined)?.message && (
            <p className="text-body-sm text-error">
              {(errors.questions as { message: string }).message}
            </p>
          )}

          {fields.map((field, idx) => (
            <div
              key={field.id}
              className="rounded-card border border-border bg-surface p-4 shadow-card space-y-3"
            >
              <div className="flex items-center gap-2">
                <span className="inline-flex min-h-[24px] min-w-[24px] items-center justify-center rounded-full bg-primary-subtle text-body-sm font-bold text-primary">
                  {idx + 1}
                </span>
                <span className="flex-1 text-body-sm font-medium text-content-muted">
                  Pergunta {idx + 1}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => move(idx, idx - 1)}
                    disabled={idx === 0}
                    className="rounded px-1.5 py-1 text-content-subtle hover:bg-surface-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Mover para cima"
                    title="Mover para cima"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, idx + 1)}
                    disabled={idx === fields.length - 1}
                    className="rounded px-1.5 py-1 text-content-subtle hover:bg-surface-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label="Mover para baixo"
                    title="Mover para baixo"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    disabled={fields.length === 1}
                    className="rounded px-1.5 py-1 text-error hover:bg-error-light disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                    aria-label="Remover pergunta"
                    title="Remover pergunta"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor={`q-text-${field.id}`}
                  className="mb-1.5 block text-body-sm font-medium text-content-muted"
                >
                  Enunciado <span className="text-error">*</span>
                </label>
                <textarea
                  id={`q-text-${field.id}`}
                  className="min-h-[60px] w-full resize-y rounded-input border border-border bg-surface px-3 py-2 text-body text-content transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  {...register(`questions.${idx}.text`)}
                  placeholder="Ex: Como você classifica sua qualidade de sono? (1-10)"
                  rows={2}
                />
                {errors.questions?.[idx]?.text && (
                  <p className="mt-1 text-body-sm text-error">
                    {errors.questions[idx]?.text?.message}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[140px]">
                  <label
                    htmlFor={`q-type-${field.id}`}
                    className="mb-1.5 block text-body-sm font-medium text-content-muted"
                  >
                    Tipo de resposta
                  </label>
                  <select
                    id={`q-type-${field.id}`}
                    className="w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    {...register(`questions.${idx}.type`)}
                  >
                    {(Object.entries(typeLabels) as [QuestionType, string][]).map(([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex cursor-pointer items-center gap-2 text-body-sm text-content-muted">
                    <input
                      type="checkbox"
                      {...register(`questions.${idx}.required`)}
                      className="rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
                    />
                    Obrigatória
                  </label>
                </div>
              </div>

              {(watch(`questions.${idx}.type`) === 'single' ||
                watch(`questions.${idx}.type`) === 'multiple') && (
                <div>
                  <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
                    Opções{' '}
                    <span className="font-normal text-content-subtle">(separe por vírgula)</span>
                  </label>
                  <Input
                    {...register(`questions.${idx}.options`)}
                    placeholder="Ex: Nunca, Raramente, Às vezes, Sempre"
                  />
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
                  Tags{' '}
                  <span className="font-normal text-content-subtle">
                    (separe por vírgula, ex: sleep, stress)
                  </span>
                </label>
                <Input
                  {...register(`questions.${idx}.tags`)}
                  placeholder="Ex: sleep, stress, food_emotional"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
                  ID interno{' '}
                  <span className="font-normal text-content-subtle">(único por template)</span>
                </label>
                <Input
                  {...register(`questions.${idx}.id`)}
                  placeholder={`q${idx + 1}`}
                  className="font-mono text-body-sm"
                />
              </div>
            </div>
          ))}

          <Button type="button" variant="secondary" onClick={addQuestion} className="w-full">
            + Adicionar pergunta
          </Button>
        </div>

        {errors.root && (
          <p className="rounded-button bg-error-light px-3 py-2 text-body-sm text-error">
            {errors.root.message}
          </p>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={isSubmitting}>
            Criar template
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/templates')}>
            Cancelar
          </Button>
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
