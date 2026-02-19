import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getInsights, generateInsights } from '@/api/ai';
import { getSession, exportSession } from '@/api/sessions';
import type { AiInsight, Session } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { RisksBarChart, type RiskItem, RadarChart, type RadarDataPoint } from '@/components/charts';
import { BreathworkCircle } from '@/components/animations';
import { AnswerAnalysis } from './components/AnswerAnalysis';
import { PatientDataIntegration } from './components/PatientDataIntegration';
import { SkeletonDetail } from '@/components/ui/SkeletonCard';

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
  const toast = useToast();
  const [insight, setInsight] = useState<AiInsight | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'json' | 'pdf' | null>(null);

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
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Erro ao gerar'))
      .finally(() => setGenerating(false));
  };

  const handleExport = useCallback(
    async (sessionId: string, format: 'json' | 'pdf') => {
      setExporting(format);
      try {
        await exportSession(sessionId, format);
        toast.success(`Export ${format.toUpperCase()} iniciado.`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Erro ao exportar');
      } finally {
        setExporting(null);
      }
    },
    [toast]
  );

  const { kpiItems, riskChartData, radarData, overallScore } = useMemo(() => {
    if (!insight?.risksJson) {
      return { kpiItems: [], riskChartData: [], radarData: [], overallScore: null };
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

    // Radar chart data (normalize all values to 0-100 scale)
    const radarData: RadarDataPoint[] = items.map(({ label, value, direction }) => ({
      category: label,
      value: direction === 'higher_better' ? value : 100 - value, // Invert for consistency
    }));

    // Calculate overall score (weighted average, higher is better)
    const weights = { readiness: 0.3, stress: 0.25, dropoutRisk: 0.25, sleepQuality: 0.2 };
    const scoreValues = items.map((item) => {
      const normalized = item.direction === 'higher_better' ? item.value : 100 - item.value;
      return normalized * (weights[item.key as keyof typeof weights] || 0.25);
    });
    const overallScore = scoreValues.length > 0 ? Math.round(scoreValues.reduce((a, b) => a + b, 0)) : null;

    return { kpiItems: items, riskChartData: chartData, radarData, overallScore };
  }, [insight?.risksJson]);

  if (!id) return <p className="text-content-muted">Sessão não informada.</p>;

  if (loading && !insight) {
    return <SkeletonDetail />;
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => id && void handleExport(id, 'json')}
            loading={exporting === 'json'}
            disabled={!!exporting}
          >
            Export JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => id && void handleExport(id, 'pdf')}
            loading={exporting === 'pdf'}
            disabled={!!exporting}
          >
            Export PDF
          </Button>
          <Link to={`/sessions/${id}`}>
            <Button variant="secondary">Voltar à sessão</Button>
          </Link>
        </div>
      </div>

      {/* Score Geral */}
      {overallScore !== null && (
        <Card title="Score Geral de Saúde" padding="md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm text-content-muted">Score calculado com base nos indicadores</p>
              <p className="mt-2 text-4xl font-bold text-primary tabular-nums">{overallScore}</p>
              <p className="mt-1 text-body-sm text-content-muted">de 100 pontos</p>
            </div>
            <div className="h-24 w-24">
              <div className="relative h-full w-full">
                <svg className="h-full w-full -rotate-90 transform">
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="var(--color-border-muted)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50%"
                    cy="50%"
                    r="45%"
                    fill="none"
                    stroke="var(--color-primary)"
                    strokeWidth="8"
                    strokeDasharray={`${2 * Math.PI * 45 * (overallScore / 100)} ${2 * Math.PI * 45}`}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-heading font-bold text-content">{overallScore}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {insight.summary && (
        <Card title="Resumo">
          <p className="text-content leading-relaxed">{insight.summary}</p>
        </Card>
      )}

      {/* Análise das Respostas */}
      {session && <AnswerAnalysis session={session} />}

      {/* Dados do Paciente */}
      {session?.patientId && <PatientDataIntegration patientId={session.patientId} />}

      {kpiItems.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card title="Indicadores de Risco (Barras)" padding="md">
              <RisksBarChart data={riskChartData} maxValue={100} />
            </Card>
            <Card title="Perfil de Risco (Radar)" padding="md">
              <RadarChart data={radarData} maxValue={100} />
            </Card>
          </div>

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

      {/* Timeline da Sessão */}
      {session && session.answers && session.answers.length > 0 && (
        <Card title="Timeline da Sessão" padding="md">
          <div className="space-y-3">
            {session.answers.map((answer, idx) => (
              <div key={answer.id} className="flex items-start gap-3 border-l-2 border-primary pl-4">
                <div className="flex-1">
                  <p className="text-body-sm font-medium text-content">
                    Resposta #{idx + 1} - {Object.keys(answer.answersJson).length} campo(s) preenchido(s)
                  </p>
                  <p className="mt-0.5 text-body-xs text-content-muted">
                    {new Date(answer.createdAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
            <div className="flex items-start gap-3 border-l-2 border-success pl-4">
              <div className="flex-1">
                <p className="text-body-sm font-medium text-content">
                  Sessão criada
                </p>
                <p className="mt-0.5 text-body-xs text-content-muted">
                  {new Date(session.createdAt).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
            {session.signatureAgreedAt && (
              <div className="flex items-start gap-3 border-l-2 border-warning pl-4">
                <div className="flex-1">
                  <p className="text-body-sm font-medium text-content">
                    Assinatura eletrônica realizada
                  </p>
                  <p className="mt-0.5 text-body-xs text-content-muted">
                    {new Date(session.signatureAgreedAt).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
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
