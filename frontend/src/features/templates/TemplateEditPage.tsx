import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getTemplate, updateTemplate } from '@/api/templates';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import type { QuestionSchema } from '@/types';

type QuestionType = 'text' | 'number' | 'single' | 'multiple';

interface QuestionDraft {
  _key: string;
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  options: string; // comma-separated; only for single/multiple
  tags: string;    // comma-separated
}

let _keyCounter = 0;
function newKey() {
  return String(++_keyCounter);
}

function blankQuestion(index: number): QuestionDraft {
  return {
    _key: newKey(),
    id: `q${index + 1}`,
    text: '',
    type: 'text',
    required: true,
    options: '',
    tags: '',
  };
}

function fromSchemaQuestion(q: QuestionSchema): QuestionDraft {
  return {
    _key: newKey(),
    id: q.id,
    text: q.text,
    type: q.type,
    required: q.required,
    options: q.options ? q.options.join(', ') : '',
    tags: q.tags ? q.tags.join(', ') : '',
  };
}

function buildSchemaJson(questions: QuestionDraft[]) {
  return {
    questions: questions.map((q) => ({
      id: q.id.trim() || `q${_keyCounter}`,
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
};

export function TemplateEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success } = useToast();

  const [name, setName] = useState('');
  const [questions, setQuestions] = useState<QuestionDraft[]>([blankQuestion(0)]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setFetching(true);
    setFetchError(null);
    getTemplate(id)
      .then((template) => {
        setName(template.name);
        const schema = template.schemaJson;
        if (schema?.questions?.length) {
          setQuestions(schema.questions.map(fromSchemaQuestion));
        } else {
          setQuestions([blankQuestion(0)]);
        }
      })
      .catch((err) => {
        setFetchError(err instanceof Error ? err.message : 'Erro ao carregar template');
      })
      .finally(() => setFetching(false));
  }, [id]);

  const updateQuestion = (key: string, patch: Partial<QuestionDraft>) => {
    setQuestions((qs) => qs.map((q) => (q._key === key ? { ...q, ...patch } : q)));
  };

  const addQuestion = () => {
    setQuestions((qs) => [...qs, blankQuestion(qs.length)]);
  };

  const removeQuestion = (key: string) => {
    setQuestions((qs) => qs.filter((q) => q._key !== key));
  };

  const moveQuestion = (key: string, direction: 'up' | 'down') => {
    setQuestions((qs) => {
      const idx = qs.findIndex((q) => q._key === key);
      if (idx === -1) return qs;
      const next = [...qs];
      const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return qs;
      [next[idx], next[swapIdx]] = [next[swapIdx], next[idx]];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    if (questions.length === 0) {
      setError('Adicione pelo menos uma pergunta.');
      return;
    }
    const emptyText = questions.find((q) => !q.text.trim());
    if (emptyText) {
      setError('Todas as perguntas precisam ter um enunciado.');
      return;
    }

    const schemaJson = buildSchemaJson(questions);
    setLoading(true);
    updateTemplate(id!, { name: name.trim(), schemaJson })
      .then(() => {
        success('Template atualizado.');
        navigate(`/templates/${id}`);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao atualizar template');
        setLoading(false);
      });
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <Card className="border-error bg-error-light">
        <p className="text-error">{fetchError}</p>
        <Button className="mt-4" onClick={() => navigate(`/templates/${id}`)}>
          Voltar
        </Button>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card title="Editar template">
        <Input
          label="Nome do template"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Anamnese inicial"
          required
        />
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-body font-semibold text-content">
            Perguntas{' '}
            <span className="ml-1 rounded-full bg-primary-light px-2 py-0.5 text-body-sm font-medium text-primary">
              {questions.length}
            </span>
          </h2>
        </div>

        {questions.map((q, idx) => (
          <div
            key={q._key}
            className="rounded-card border border-border bg-surface p-4 shadow-card space-y-3"
          >
            {/* Question header */}
            <div className="flex items-center gap-2">
              <span className="inline-flex min-h-[24px] min-w-[24px] items-center justify-center rounded-full bg-primary-light text-body-sm font-bold text-primary">
                {idx + 1}
              </span>
              <span className="flex-1 text-body-sm font-medium text-content-muted">
                Pergunta {idx + 1}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveQuestion(q._key, 'up')}
                  disabled={idx === 0}
                  className="rounded px-1.5 py-1 text-content-subtle hover:bg-surface-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Mover para cima"
                  title="Mover para cima"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveQuestion(q._key, 'down')}
                  disabled={idx === questions.length - 1}
                  className="rounded px-1.5 py-1 text-content-subtle hover:bg-surface-muted disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label="Mover para baixo"
                  title="Mover para baixo"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => removeQuestion(q._key)}
                  disabled={questions.length === 1}
                  className="rounded px-1.5 py-1 text-error hover:bg-error-light disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                  aria-label="Remover pergunta"
                  title="Remover pergunta"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Enunciado */}
            <div>
              <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
                Enunciado <span className="text-error">*</span>
              </label>
              <textarea
                className="min-h-[60px] w-full resize-y rounded-input border border-border bg-surface px-3 py-2 text-body text-content transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                value={q.text}
                onChange={(e) => updateQuestion(q._key, { text: e.target.value })}
                placeholder="Ex: Como você classifica sua qualidade de sono? (1-10)"
                rows={2}
              />
            </div>

            {/* Type + Required */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[140px]">
                <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
                  Tipo de resposta
                </label>
                <select
                  className="w-full rounded-input border border-border bg-surface px-3 py-2 text-body text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  value={q.type}
                  onChange={(e) =>
                    updateQuestion(q._key, { type: e.target.value as QuestionType })
                  }
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
                    checked={q.required}
                    onChange={(e) => updateQuestion(q._key, { required: e.target.checked })}
                    className="rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
                  />
                  Obrigatória
                </label>
              </div>
            </div>

            {/* Opções (single / multiple) */}
            {(q.type === 'single' || q.type === 'multiple') && (
              <div>
                <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
                  Opções{' '}
                  <span className="font-normal text-content-subtle">(separe por vírgula)</span>
                </label>
                <Input
                  value={q.options}
                  onChange={(e) => updateQuestion(q._key, { options: e.target.value })}
                  placeholder="Ex: Nunca, Raramente, Às vezes, Sempre"
                />
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
                Tags{' '}
                <span className="font-normal text-content-subtle">
                  (separe por vírgula, ex: sleep, stress)
                </span>
              </label>
              <Input
                value={q.tags}
                onChange={(e) => updateQuestion(q._key, { tags: e.target.value })}
                placeholder="Ex: sleep, stress, food_emotional"
              />
            </div>

            {/* ID da pergunta */}
            <div>
              <label className="mb-1.5 block text-body-sm font-medium text-content-muted">
                ID interno{' '}
                <span className="font-normal text-content-subtle">(único por template)</span>
              </label>
              <Input
                value={q.id}
                onChange={(e) => updateQuestion(q._key, { id: e.target.value })}
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

      {error && (
        <p className="rounded-button bg-error-light px-3 py-2 text-body-sm text-error">{error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" loading={loading}>
          Salvar alterações
        </Button>
        <Button type="button" variant="secondary" onClick={() => navigate(`/templates/${id}`)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
