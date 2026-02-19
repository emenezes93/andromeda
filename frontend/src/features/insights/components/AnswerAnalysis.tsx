import { useMemo } from 'react';
import type { Session, QuestionSchema } from '@/types';
import { Card } from '@/components/ui/Card';
import { PieChart } from '@/components/charts';
import { Badge } from '@/components/ui/Badge';

interface AnswerAnalysisProps {
  session: Session;
}

export function AnswerAnalysis({ session }: AnswerAnalysisProps) {
  const analysis = useMemo(() => {
    if (!session.template?.schemaJson?.questions || !session.answers?.length) {
      return null;
    }

    const questions = session.template.schemaJson.questions;
    const lastAnswer = session.answers[session.answers.length - 1];
    const answers = lastAnswer?.answersJson || {};

    // Análise por tipo de pergunta
    const typeCount: Record<string, number> = {};
    const tagCount: Record<string, number> = {};
    let answeredCount = 0;
    let requiredCount = 0;
    let requiredAnswered = 0;

    questions.forEach((q: QuestionSchema) => {
      typeCount[q.type] = (typeCount[q.type] || 0) + 1;
      if (q.required) requiredCount++;
      if (answers[q.id] !== undefined && answers[q.id] !== '') {
        answeredCount++;
        if (q.required) requiredAnswered++;
        // Contar tags
        if (q.tags) {
          q.tags.forEach((tag) => {
            tagCount[tag] = (tagCount[tag] || 0) + 1;
          });
        }
      }
    });

    const completionRate = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
    const requiredCompletionRate =
      requiredCount > 0 ? (requiredAnswered / requiredCount) * 100 : 100;

    return {
      totalQuestions: questions.length,
      answeredCount,
      requiredCount,
      requiredAnswered,
      completionRate,
      requiredCompletionRate,
      typeDistribution: Object.entries(typeCount).map(([type, count]) => ({
        name: type === 'single' ? 'Escolha única' : type === 'multiple' ? 'Múltipla escolha' : type === 'number' ? 'Número' : 'Texto',
        value: count,
      })),
      tagDistribution: Object.entries(tagCount)
        .map(([tag, count]) => ({ name: tag, value: count }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8), // Top 8 tags
    };
  }, [session]);

  if (!analysis) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Estatísticas de Completude" padding="md">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-body-sm text-content-muted">Taxa de completude</span>
            <span className="text-heading font-bold text-content">
              {analysis.completionRate.toFixed(1)}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${analysis.completionRate}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-body-sm text-content-muted">Respondidas</p>
              <p className="text-heading font-semibold text-content">
                {analysis.answeredCount} / {analysis.totalQuestions}
              </p>
            </div>
            <div>
              <p className="text-body-sm text-content-muted">Obrigatórias</p>
              <p className="text-heading font-semibold text-content">
                {analysis.requiredAnswered} / {analysis.requiredCount}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card title="Distribuição por Tipo" padding="md">
        {analysis.typeDistribution.length > 0 ? (
          <PieChart data={analysis.typeDistribution} innerRadius={40} outerRadius={70} />
        ) : (
          <p className="text-body-sm text-content-muted">Sem dados disponíveis</p>
        )}
      </Card>

      {analysis.tagDistribution.length > 0 && (
        <Card title="Tags Mais Frequentes" padding="md" className="lg:col-span-2">
          <div className="flex flex-wrap gap-2">
            {analysis.tagDistribution.map((tag) => (
              <Badge key={tag.name} variant="primary">
                {tag.name} ({tag.value})
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
