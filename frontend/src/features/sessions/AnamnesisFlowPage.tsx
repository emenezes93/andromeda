import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNextQuestion } from '@/api/engine';
import { getSession, submitAnswers, signSession } from '@/api/sessions';
import type { QuestionSchema } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SignatureStep } from '@/components/session/SignatureStep';
import { SentimentBar } from '@/components/session/SentimentBar';

export function AnamnesisFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [question, setQuestion] = useState<QuestionSchema | null>(null);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [currentValue, setCurrentValue] = useState<string | number | string[]>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignatureStep, setShowSignatureStep] = useState(false);
  const [pendingFinalAnswers, setPendingFinalAnswers] = useState<Record<string, unknown> | null>(null);

  // Carrega apenas a primeira pergunta ao montar (respostas existentes são carregadas abaixo)
  const fetchNext = useCallback(
    (currentAnswers: Record<string, unknown>) => {
      if (!id) return;
      setLoading(true);
      setError(null);
      getNextQuestion(id, currentAnswers)
        .then((res) => {
          setQuestion(res.nextQuestion);
          setCompletionPercent(res.completionPercent);
          setCurrentValue('');
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
        .finally(() => setLoading(false));
    },
    [id]
  );

  useEffect(() => {
    if (!id) return;
    // Carregar respostas já enviadas (último envio da sessão) para continuar de onde parou
    getSession(id)
      .then((session) => {
        const last = session.answers?.length
          ? session.answers[session.answers.length - 1]
          : undefined;
        const initial =
          last && last.answersJson && typeof last.answersJson === 'object'
            ? { ...last.answersJson }
            : {};
        setAnswers(initial);
        fetchNext(initial);
      })
      .catch(() => fetchNext({}));
  }, [id, fetchNext]);

  const handleNext = () => {
    if (!id || !question) return;
    const value =
      question.type === 'number'
        ? Number(currentValue)
        : question.type === 'multiple' && Array.isArray(currentValue)
          ? currentValue
          : typeof currentValue === 'string'
            ? currentValue
            : currentValue;
    if (question.required) {
      const empty =
        value === '' ||
        value === undefined ||
        (Array.isArray(value) && value.length === 0);
      if (empty) {
        setError('Responda à pergunta para continuar.');
        return;
      }
    }
    const newAnswers = { ...answers, [question.id]: value };
    setSubmitting(true);
    setError(null);
    getNextQuestion(id, newAnswers)
      .then((res) => {
        if (res.nextQuestion === null) {
          setPendingFinalAnswers(newAnswers);
          setShowSignatureStep(true);
          setAnswers(newAnswers);
          setCompletionPercent(100);
          return;
        }
        setAnswers(newAnswers);
        setQuestion(res.nextQuestion);
        setCompletionPercent(res.completionPercent);
        setCurrentValue('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => setSubmitting(false));
  };

  const handleSigned = useCallback(
    async (payload: { signerName: string; agreed: true }) => {
      if (!id || !pendingFinalAnswers) return;
      await signSession(id, payload);
      await submitAnswers(id, pendingFinalAnswers);
      navigate(`/sessions/${id}/insights`, { replace: true });
    },
    [id, pendingFinalAnswers, navigate]
  );

  if (!id) return <p className="text-content-muted">Sessão não informada.</p>;

  if (showSignatureStep && pendingFinalAnswers) {
    return (
      <div className="mx-auto max-w-2xl">
        <SignatureStep onSign={handleSigned} />
        <Button
          variant="ghost"
          size="sm"
          className="mt-4"
          onClick={() => navigate(`/sessions/${id}`)}
        >
          Voltar à sessão
        </Button>
      </div>
    );
  }

  if (loading && !question) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !question) {
    return (
      <Card className="border-error bg-error-light">
        <p className="text-error">{error}</p>
        <Button className="mt-4" onClick={() => navigate(`/sessions/${id}`)}>
          Voltar à sessão
        </Button>
      </Card>
    );
  }

  if (question === null && completionPercent === 100) {
    return (
      <Card>
        <p className="text-content">Concluído! Enviando respostas…</p>
      </Card>
    );
  }

  if (!question) {
    return (
      <Card>
        <p className="text-content-muted">Nenhuma pergunta no momento.</p>
        <Button className="mt-4" onClick={() => navigate(`/sessions/${id}`)}>
          Voltar à sessão
        </Button>
      </Card>
    );
  }

  const currentStep = Object.keys(answers).length + 1;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Step UX: etapa atual + barra de progresso */}
      <div className="rounded-card border border-border bg-surface p-4 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex min-h-[28px] min-w-[28px] items-center justify-center rounded-full bg-primary-subtle text-body-sm font-bold text-primary"
              aria-hidden
            >
              {currentStep}
            </span>
            <span className="text-body-sm font-medium text-content-muted">
              Pergunta {currentStep}
            </span>
          </div>
          <span
            className="text-body-sm font-semibold tabular-nums text-content"
            aria-live="polite"
          >
            {completionPercent}% concluído
          </span>
        </div>
        <div
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuenow={completionPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Progresso do questionário"
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-normal ease-calm"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      <Card>
        <h2 className="text-heading-sm font-semibold text-content">{question.text}</h2>
        {question.type === 'number' && (
          <div className="mt-4">
            <Input
              type="number"
              value={
                typeof currentValue === 'number'
                  ? currentValue
                  : currentValue === ''
                    ? ''
                    : Number(currentValue) || ''
              }
              onChange={(e) =>
                setCurrentValue(e.target.value === '' ? '' : Number(e.target.value) || e.target.value)
              }
              placeholder="Digite o valor"
            />
          </div>
        )}
        {question.type === 'single' && question.options && question.options.length > 0 && (
          <div className="mt-4 space-y-2">
            {question.options.map((opt) => (
              <label key={opt} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name={question.id}
                  value={opt}
                  checked={currentValue === opt}
                  onChange={() => setCurrentValue(opt)}
                  className="border-border text-primary focus:ring-2 focus:ring-primary/20"
                />
                <span className="text-content">{opt}</span>
              </label>
            ))}
          </div>
        )}
        {question.type === 'multiple' && question.options && question.options.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-body-sm text-content-muted">Marque todas que se aplicam:</p>
            {question.options.map((opt: string) => {
              const selected: string[] = Array.isArray(currentValue) ? currentValue : [];
              const checked = selected.includes(opt);
              return (
                <label key={opt} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    name={question.id}
                    value={opt}
                    checked={checked}
                    onChange={() => {
                      const next: string[] = checked
                        ? selected.filter((v) => v !== opt)
                        : [...selected, opt];
                      setCurrentValue(next);
                    }}
                    className="rounded border-border text-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <span className="text-content">{opt}</span>
                </label>
              );
            })}
          </div>
        )}
        {question.type === 'sentiment' && (
          <SentimentBar
            value={typeof currentValue === 'string' ? currentValue : ''}
            onChange={(v) => setCurrentValue(v)}
            ariaLabel={question.text}
          />
        )}
        {(question.type === 'text' || (question.type === 'multiple' && !question.options?.length)) && (
          <div className="mt-4">
            <textarea
              className="min-h-touch w-full rounded-button border border-border bg-surface px-3 py-2.5 text-content transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              rows={3}
              value={typeof currentValue === 'string' ? currentValue : ''}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder="Sua resposta"
            />
          </div>
        )}
        {error && (
          <p className="mt-2 text-body-sm text-error" role="alert">
            {error}
          </p>
        )}
        <div className="mt-6 flex items-center justify-between gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/sessions/${id}`)}>
            Voltar à sessão
          </Button>
          <Button onClick={handleNext} loading={submitting} size="lg">
            {completionPercent >= 90 ? 'Concluir' : 'Próxima'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
