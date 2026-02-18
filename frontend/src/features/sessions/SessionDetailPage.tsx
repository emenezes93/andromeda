import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSession } from '@/api/sessions';
import type { Session, QuestionSchema } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SessionStatusBadge } from '@/components/ui/SessionStatusBadge';

function formatAnswerValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getSession(id)
      .then(setSession)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) return <p className="text-content-muted">ID não informado.</p>;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <Card className="border-error bg-error-light">
        <p className="text-error">{error ?? 'Sessão não encontrada.'}</p>
        <Link to="/sessions">
          <Button variant="secondary" className="mt-4">
            Voltar à lista
          </Button>
        </Link>
      </Card>
    );
  }

  const templateName = session.template?.name ?? 'Template';
  const questions: QuestionSchema[] = session.template?.schemaJson?.questions ?? [];
  const lastAnswerEntry = session.answers?.length
    ? session.answers[session.answers.length - 1]
    : undefined;
  const answersMap: Record<string, unknown> =
    lastAnswerEntry?.answersJson && typeof lastAnswerEntry.answersJson === 'object'
      ? lastAnswerEntry.answersJson
      : {};
  const hasAnswers = Object.keys(answersMap).length > 0;
  const isComplete = session.status === 'completed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold text-content">{templateName}</h2>
            {session.status && <SessionStatusBadge status={session.status} />}
          </div>
          <p className="text-sm text-content-muted">
            Criada em {new Date(session.createdAt).toLocaleString('pt-BR')}
          </p>
          {lastAnswerEntry && (
            <p className="text-xs text-content-subtle">
              Última resposta em {new Date(lastAnswerEntry.createdAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {!isComplete && (
            <Link to={`/sessions/${session.id}/flow`}>
              <Button>{hasAnswers ? 'Continuar anamnese' : 'Iniciar anamnese'}</Button>
            </Link>
          )}
          <Link to={`/sessions/${session.id}/insights`}>
            <Button variant="secondary">Ver insights</Button>
          </Link>
        </div>
      </div>

      {/* Respostas */}
      {questions.length > 0 ? (
        <Card title="Respostas do paciente">
          {!hasAnswers ? (
            <p className="text-content-muted">
              Nenhuma resposta registrada ainda.{' '}
              {!isComplete && (
                <Link
                  to={`/sessions/${session.id}/flow`}
                  className="font-medium text-primary hover:underline"
                >
                  Iniciar anamnese
                </Link>
              )}
            </p>
          ) : (
            <ul className="divide-y divide-border-muted">
              {questions.map((q) => {
                const answer = answersMap[q.id];
                const answered = answer !== undefined && answer !== '';
                return (
                  <li key={q.id} className="py-3 first:pt-0 last:pb-0">
                    <p className="text-body-sm font-medium text-content-muted">{q.text}</p>
                    <p
                      className={`mt-0.5 text-body ${answered ? 'text-content' : 'text-content-subtle italic'}`}
                    >
                      {answered ? formatAnswerValue(answer) : 'Não respondida'}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      ) : (
        <Card title="Respostas">
          <p className="text-content-muted">
            {hasAnswers
              ? `${Object.keys(answersMap).length} resposta(s) registrada(s).`
              : 'Nenhuma resposta registrada ainda.'}
          </p>
        </Card>
      )}

      <div>
        <Link to="/sessions">
          <Button variant="secondary">Voltar à lista de sessões</Button>
        </Link>
      </div>
    </div>
  );
}
