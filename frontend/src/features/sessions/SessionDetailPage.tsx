import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getSession } from '@/api/sessions';
import type { Session } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

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

  if (!id) return <p className="text-slate-600">ID não informado.</p>;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <Card className="border-red-200 bg-red-50">
        <p className="text-red-700">{error ?? 'Sessão não encontrada.'}</p>
        <Link to="/sessions">
          <Button variant="secondary" className="mt-4">
            Voltar à lista
          </Button>
        </Link>
      </Card>
    );
  }

  const templateName = (session.template as { name?: string })?.name ?? 'Template';
  const hasAnswers = (session.answers?.length ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{templateName}</h2>
          <p className="text-sm text-slate-500">
            Criada em {new Date(session.createdAt).toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to={`/sessions/${session.id}/flow`}>
            <Button>{hasAnswers ? 'Continuar anamnese' : 'Iniciar anamnese'}</Button>
          </Link>
          <Link to={`/sessions/${session.id}/insights`}>
            <Button variant="secondary">Ver insights</Button>
          </Link>
        </div>
      </div>

      <Card title="Resumo">
        <p className="text-slate-600">
          Respostas enviadas: {session.answers?.length ?? 0} vez(es).
        </p>
      </Card>

      <div>
        <Link to="/sessions">
          <Button variant="secondary">Voltar à lista de sessões</Button>
        </Link>
      </div>
    </div>
  );
}
