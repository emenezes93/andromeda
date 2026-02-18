import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getNextQuestion } from '@/api/engine';
import { getSession, submitAnswers } from '@/api/sessions';
import type { QuestionSchema } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';

export function AnamnesisFlowPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [question, setQuestion] = useState<QuestionSchema | null>(null);
  const [completionPercent, setCompletionPercent] = useState(0);
  const [currentValue, setCurrentValue] = useState<string | number>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        : typeof currentValue === 'string'
          ? currentValue
          : currentValue;
    if (question.required && (value === '' || value === undefined)) {
      setError('Responda à pergunta para continuar.');
      return;
    }
    const newAnswers = { ...answers, [question.id]: value };
    setSubmitting(true);
    setError(null);
    getNextQuestion(id, newAnswers)
      .then((res) => {
        if (res.nextQuestion === null) {
          return submitAnswers(id, newAnswers).then(() => {
            navigate(`/sessions/${id}/insights`, { replace: true });
          });
        }
        setAnswers(newAnswers);
        setQuestion(res.nextQuestion);
        setCompletionPercent(res.completionPercent);
        setCurrentValue('');
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro'))
      .finally(() => setSubmitting(false));
  };

  if (!id) return <p className="text-slate-600">Sessão não informada.</p>;

  if (loading && !question) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !question) {
    return (
      <Card className="border-red-200 bg-red-50">
        <p className="text-red-700">{error}</p>
        <Button className="mt-4" onClick={() => navigate(`/sessions/${id}`)}>
          Voltar à sessão
        </Button>
      </Card>
    );
  }

  if (question === null && completionPercent === 100) {
    return (
      <Card>
        <p className="text-slate-700">Concluído! Enviando respostas…</p>
      </Card>
    );
  }

  if (!question) {
    return (
      <Card>
        <p className="text-slate-600">Nenhuma pergunta no momento.</p>
        <Button className="mt-4" onClick={() => navigate(`/sessions/${id}`)}>
          Voltar à sessão
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between text-sm text-slate-600">
        <span>Progresso: {completionPercent}%</span>
        <div className="h-2 w-48 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${completionPercent}%` }}
          />
        </div>
      </div>

      <Card>
        <h3 className="text-lg font-semibold text-slate-900">{question.text}</h3>
        {question.type === 'number' && (
          <div className="mt-4">
            <Input
              type="number"
              min={1}
              max={10}
              value={typeof currentValue === 'number' ? currentValue : ''}
              onChange={(e) => setCurrentValue(e.target.value ? Number(e.target.value) : '')}
              placeholder="1 a 10"
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
                  className="border-border text-primary focus:ring-primary"
                />
                <span className="text-slate-700">{opt}</span>
              </label>
            ))}
          </div>
        )}
        {(question.type === 'text' || question.type === 'multiple') && (
          <div className="mt-4">
            <textarea
              className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              rows={3}
              value={typeof currentValue === 'string' ? currentValue : ''}
              onChange={(e) => setCurrentValue(e.target.value)}
              placeholder="Sua resposta"
            />
          </div>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-6">
          <Button onClick={handleNext} loading={submitting}>
            Próxima
          </Button>
        </div>
      </Card>
    </div>
  );
}
