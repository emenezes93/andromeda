import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getTemplate } from '@/api/templates';
import type { Template } from '@/types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonDetail } from '@/components/ui/SkeletonCard';

export function TemplateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getTemplate(id)
      .then(setTemplate)
      .catch((err) => setError(err instanceof Error ? err.message : 'Erro ao carregar'))
      .finally(() => setLoading(false));
  }, [id]);

  if (!id) {
    return <p className="text-content-muted">ID não informado.</p>;
  }

  if (loading) {
    return <SkeletonDetail />;
  }

  if (error || !template) {
    return (
      <Card className="border-error bg-error-light">
        <p className="text-error">{error ?? 'Template não encontrado.'}</p>
        <Link to="/templates">
          <Button variant="secondary" className="mt-4">
            Voltar à lista
          </Button>
        </Link>
      </Card>
    );
  }

  const questions = template.schemaJson?.questions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-content">{template.name}</h2>
          <p className="text-sm text-content-muted">
            Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
          </p>
        </div>
        <Link to={`/sessions/new?templateId=${template.id}`}>
          <Button>Nova sessão com este template</Button>
        </Link>
      </div>

      <Card title="Perguntas">
        {questions.length === 0 ? (
          <p className="text-content-muted">Nenhuma pergunta no schema.</p>
        ) : (
          <ul className="space-y-3">
            {questions.map((q) => (
              <li key={q.id} className="rounded-lg border border-border bg-surface-muted p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs text-content-muted">{q.id}</span>
                    <p className="font-medium text-content">{q.text}</p>
                    <p className="text-sm text-content-muted">
                      Tipo: {q.type}
                      {q.options?.length ? ` • Opções: ${q.options.join(', ')}` : ''}
                      {q.tags?.length ? ` • Tags: ${q.tags.join(', ')}` : ''}
                    </p>
                  </div>
                  {q.required && (
                    <Badge variant="warning">Obrigatório</Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        <Link to="/templates">
          <Button variant="secondary">Voltar à lista de templates</Button>
        </Link>
      </div>
    </div>
  );
}
