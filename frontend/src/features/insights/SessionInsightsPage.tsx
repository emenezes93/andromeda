import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInsights, generateInsights } from '@/api/ai';
import { getSession } from '@/api/sessions';
import type { AiInsight, Session } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RisksBarChart, type RiskItem } from '@/components/charts';
import { BreathworkCircle } from '@/components/animations';

// Define direção de cada métrica: 'higher_worse' → risco cresce com o valor
// 'higher_better' → risco diminui com o valor (inverte a escala de cores)
const metricConfig: Record<
  string,
  { label: string; direction: 'higher_worse' | 'higher_better' }
> = {
  readiness: { label: 'Disposição', direction: 'higher_better' },
  stress: { label: 'Estresse', direction: 'higher_worse' },
  dropoutRisk: { label: 'Risco de desistência', direction: 'higher_worse' },
  sleepQuality: { label: 'Qualidade do sono', direction: 'higher_better' },
};

type RiskLevel = 'low' | 'medium' | 'high';

function getRiskLevel(value: number, direction: 'higher_worse' | 'higher_better'): RiskLevel {
  const effectiveValue = direction === 'higher_better' ? 100 - value : value;
  if (effectiveValue <= 33) return 'low';
  if (effectiveValue <= 66) return 'medium';
  return 'high';
}

const riskLevelConfig: Record<
  RiskLevel,
  { label: string; valueClass: string; bgClass: string; borderClass: string }
> = {
  low: {
    label: 'Baixo',
    valueClass: 'text-success',
    bgClass: 'bg-success-light',
    borderClass: 'border-success',
  },
  medium: {
    label: 'Médio',
    valueClass: 'text-warning',
    bgClass: 'bg-warning-light',
    borderClass: 'border-warning',
  },
  high: {
    label: 'Alto',
    valueClass: 'text-error',
    bgClass: 'bg-error-light',
    borderClass: 'border-error',
  },
};

export function SessionInsightsPage() {
  const { id } = useParams<{ id: string }>();
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.allSettled([getInsights(id), getSession(id)])
      .then(([insightResult, sessionResult]) => {
        if (insightResult.status === 'fulfilled') setInsight(insightResult.value);
        else {
          setInsight(null);
          const msg = insightResult.reason?.message ?? '';
          if (
            msg.includes('404') ||
            msg.toLowerCase().includes('not found')
          ) {
            setError(null);
          } else {
            setError(insightResult.reason instanceof Error ? insightResult.reason.message : 'Erro ao carregar');
          }
        }
        if (sessionResult.status === 'fulfilled') setSession(sessionResult.value);
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

  const { kpiItems, riskChartData } = useMemo(() => {
    if (!insight?.risksJson) {
      return { kpiItems: [], riskChartData: [] };
    }
    const risks = insight.risksJson;

    const items = (Object.entries(metricConfig) as [string, (typeof metricConfig)[string]][])
      .map(([key, cfg]) => {
        const value = risks[key as keyof typeof risks];
        if (typeof value !== 'number') return null;
        const level = getRiskLevel(value, cfg.direction);
        return { key, label: cfg.label, value, level, direction: cfg.direction };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const chartData: RiskItem[] = items.map(({ key, label, value }) => ({ key, label, value }));

    return { kpiItems: items, riskChartData: chartData };
  }, [insight?.risksJson]);

  if (!id) return <p className="text-content-muted">Sessão não informada.</p>;

  if (loading && !insight) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error && !insight && !generating) {
    return (
      <Card className="border-error bg-error-light">
        <p className="text-error">{error}</p>
        <Button className="mt-4" onClick={() => load()}>
          Tentar novamente
        </Button>
      </Card>
    );
  }

  if (!insight) {
    return (
      <Card title="Insights">
        <p className="text-content-muted">
          Nenhum insight gerado para esta sessão. Gere agora com base nas respostas.
        </p>
        <Button className="mt-4" variant="tactile" onClick={handleGenerate} loading={generating}>
          Gerar insights
        </Button>
        <Link to={`/sessions/${id}`} className="ml-3 inline-block">
          <Button variant="secondary">Voltar à sessão</Button>
        </Link>
      </Card>
    );
  }

  const recommendations = Array.isArray(insight.recommendationsJson)
    ? insight.recommendationsJson
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-content">Insights da sessão</h2>
          {session?.signatureAgreedAt && session?.signatureName && (
            <p className="mt-0.5 text-body-sm text-content-muted">
              Assinado por {session.signatureName} em{' '}
              {new Date(session.signatureAgreedAt).toLocaleString('pt-BR')}
            </p>
          )}
        </div>
        <Link to={`/sessions/${id}`}>
          <Button variant="secondary">Voltar à sessão</Button>
        </Link>
      </div>

      {insight.summary && (
        <Card title="Resumo">
          <p className="text-content leading-relaxed">{insight.summary}</p>
        </Card>
      )}

      {kpiItems.length > 0 && (
        <div className="space-y-4">
          <Card title="Indicadores de risco" padding="md">
            <RisksBarChart data={riskChartData} maxValue={100} />
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpiItems.map(({ key, label, value, level }) => {
              const levelCfg = riskLevelConfig[level];
              return (
                <div
                  key={key}
                  className={`rounded-card border p-4 transition-calm hover:shadow-soft ${levelCfg.bgClass} ${levelCfg.borderClass}`}
                >
                  <p className="text-sm font-medium text-content-muted">{label}</p>
                  <p className={`mt-1 text-2xl font-bold tabular-nums ${levelCfg.valueClass}`}>
                    {value}
                    <span className="ml-1 text-sm font-normal opacity-70">/ 100</span>
                  </p>
                  <p className={`mt-1 text-xs font-semibold uppercase tracking-wide ${levelCfg.valueClass}`}>
                    {levelCfg.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {recommendations.length > 0 && (
        <Card title="Recomendações">
          <ul className="list-inside list-disc space-y-1.5 text-content" role="list">
            {recommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card title="Um momento de calma" padding="md">
        <div className="flex flex-col items-center gap-4">
          <BreathworkCircle inhaleSeconds={4} exhaleSeconds={4} size={140} showLabel />
          <p className="text-center text-body-sm text-content-muted">
            Acompanhe o círculo: inspire quando expandir e expire quando contrair.
          </p>
        </div>
      </Card>

      <p className="text-xs text-content-subtle">
        Gerado em {new Date(insight.createdAt).toLocaleString('pt-BR')}
      </p>
    </div>
  );
}
