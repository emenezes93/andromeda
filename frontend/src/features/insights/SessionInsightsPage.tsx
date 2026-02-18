import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInsights, generateInsights } from '@/api/ai';
import type { AiInsight } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function SessionInsightsPage() {
  const { id } = useParams<{ id: string }>();
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getInsights(id)
      .then(setInsight)
      .catch((err) => {
        if (
          (err as Error).message?.includes('404') ||
          (err as Error).message?.toLowerCase().includes('not found')
        ) {
          setInsight(null);
          setError(null);
        } else {
          setError(err instanceof Error ? err.message : 'Erro ao carregar');
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => load(), [load]);

  const handleGenerate = () => {
    if (!id) return;
    setGenerating(true);
    setError(null);
    generateInsights(id)
      .then(setInsight)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao gerar'))
      .finally(() => setGenerating(false));
  };

  if (!id) return <p className="text-slate-600">Sessão não informada.</p>;

  if (loading && !insight) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !insight && !generating) {
    return (
      <Card className="border-red-200 bg-red-50">
        <p className="text-red-700">{error}</p>
        <Button className="mt-4" onClick={() => load()}>
          Tentar novamente
        </Button>
      </Card>
    );
  }

  if (!insight) {
    return (
      <Card title="Insights">
        <p className="text-slate-600">
          Nenhum insight gerado para esta sessão. Gere agora com base nas respostas.
        </p>
        <Button className="mt-4" onClick={handleGenerate} loading={generating}>
          Gerar insights
        </Button>
        <Link to={`/sessions/${id}`} className="ml-3 inline-block">
          <Button variant="secondary">Voltar à sessão</Button>
        </Link>
      </Card>
    );
  }

  const risks = insight.risksJson ?? {};
  const recommendations = Array.isArray(insight.recommendationsJson)
    ? insight.recommendationsJson
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">Insights da sessão</h2>
        <Link to={`/sessions/${id}`}>
          <Button variant="secondary">Voltar à sessão</Button>
        </Link>
      </div>

      {insight.summary && (
        <Card title="Resumo">
          <p className="text-slate-700">{insight.summary}</p>
        </Card>
      )}

      <Card title="Indicadores de risco (0–100)">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {typeof risks.readiness === 'number' && (
            <div>
              <p className="text-sm text-slate-500">Disposição</p>
              <p className="text-2xl font-semibold text-slate-900">{risks.readiness}</p>
            </div>
          )}
          {typeof risks.stress === 'number' && (
            <div>
              <p className="text-sm text-slate-500">Estresse</p>
              <p className="text-2xl font-semibold text-slate-900">{risks.stress}</p>
            </div>
          )}
          {typeof risks.dropoutRisk === 'number' && (
            <div>
              <p className="text-sm text-slate-500">Risco de desistência</p>
              <p className="text-2xl font-semibold text-slate-900">{risks.dropoutRisk}</p>
            </div>
          )}
          {typeof risks.sleepQuality === 'number' && (
            <div>
              <p className="text-sm text-slate-500">Qualidade do sono</p>
              <p className="text-2xl font-semibold text-slate-900">{risks.sleepQuality}</p>
            </div>
          )}
        </div>
      </Card>

      {recommendations.length > 0 && (
        <Card title="Recomendações">
          <ul className="list-inside list-disc space-y-1 text-slate-700">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-xs text-slate-400">
        Gerado em {new Date(insight.createdAt).toLocaleString('pt-BR')}
      </p>
    </div>
  );
}
