import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  getPublicFillData,
  postPublicNextQuestion,
  postPublicAnswers,
  postPublicSign,
} from '@/api/publicFill';
import type { QuestionSchema } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { SignatureStep } from '@/components/session/SignatureStep';

export function PublicFillPage() {
  const { token } = useParams<{ token: string }>();
  const [templateName, setTemplateName] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [question, setQuestion] = useState<QuestionSchema | null>(null);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [currentValue, setCurrentValue] = useState<string | number | string[]>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignatureStep, setShowSignatureStep] = useState(false);
  const [pendingFinalAnswers, setPendingFinalAnswers] = useState<Record<string, unknown> | null>(null);
  const [success, setSuccess] = useState(false);

  const fetchNext = useCallback(
    (currentAnswers: Record<string, unknown>) => {
      if (!token) return;
      setLoading(true);
      setError(null);
      postPublicNextQuestion(token, currentAnswers)
        .then((res) => {
          setQuestion(res.nextQuestion);
          setCompletionPercent(res.completionPercent);
          setCurrentValue('');
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
        .finally(() => setLoading(false));
    },
    [token]
  );

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    getPublicFillData(token)
      .then((data) => {
        setTemplateName(data.templateName);
        setAnswers(data.currentAnswers);
        fetchNext(data.currentAnswers);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Link inválido ou sessão já concluída');
        setLoading(false);
      });
  }, [token, fetchNext]);

  const handleNext = () => {
    if (!token || !question) return;
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
    postPublicNextQuestion(token, newAnswers)
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
      if (!token || !pendingFinalAnswers) return;
      await postPublicAnswers(token, pendingFinalAnswers);
      await postPublicSign(token, payload);
      setSuccess(true);
    },
    [token, pendingFinalAnswers]
  );

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card>
          <p className="text-content-muted">Link não informado.</p>
        </Card>
      </div>
    );
  }

  if (error && !question && !showSignatureStep && !success) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-surface-calm">
        <Card className="max-w-md border-error bg-error-light">
          <p className="text-error">{error}</p>
          <p className="mt-2 text-body-sm text-content-muted">
            Este link pode ter expirado ou a sessão já foi concluída.
          </p>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-surface-calm">
        <Card className="max-w-md text-center">
          <h2 className="text-heading font-semibold text-content">Obrigado</h2>
          <p className="mt-2 text-body text-content-muted">
            Suas respostas foram enviadas com sucesso. Em breve você poderá ver o resultado com seu
            profissional.
          </p>
        </Card>
      </div>
    );
  }

  if (showSignatureStep && pendingFinalAnswers) {
    return (
      <div className="min-h-screen bg-surface-calm px-4 py-8">
        <div className="mx-auto max-w-2xl">
          <p className="mb-4 text-body-sm text-content-muted">{templateName}</p>
          <SignatureStep onSign={handleSigned} />
        </div>
      </div>
    );
  }

  if (loading && !question) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface-calm">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-surface-calm">
        <Card>
          <p className="text-content-muted">Nenhuma pergunta no momento.</p>
        </Card>
      </div>
    );
  }

  const currentStep = Object.keys(answers).length + 1;

  return (
    <div className="min-h-screen bg-surface-calm px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-card border border-border bg-surface p-4 shadow-card">
          <p className="text-body-sm text-content-muted">{templateName}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-body-sm font-medium text-content-muted">
              Pergunta {currentStep}
            </span>
            <span className="text-body-sm font-semibold tabular-nums text-content">
              {completionPercent}% concluído
            </span>
          </div>
          <div
            className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted"
            role="progressbar"
            aria-valuenow={completionPercent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-all duration-normal"
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
                  setCurrentValue(
                    e.target.value === '' ? '' : Number(e.target.value) || e.target.value
                  )
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
          {(question.type === 'text' ||
            (question.type === 'multiple' && !question.options?.length)) && (
            <div className="mt-4">
              <textarea
                className="min-h-touch w-full rounded-button border border-border bg-surface px-3 py-2.5 text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
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
          <div className="mt-6">
            <Button onClick={handleNext} loading={submitting} size="lg" className="w-full">
              {completionPercent >= 90 ? 'Concluir' : 'Próxima'}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
