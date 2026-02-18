import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { listTemplates } from '@/api/templates';
import { createSession } from '@/api/sessions';
import type { Template } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function NewSessionPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedId = searchParams.get('templateId');

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [templateId, setTemplateId] = useState(preselectedId ?? '');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTemplates({ limit: 100 })
      .then((res) => setTemplates(res.data))
      .catch(() => setError('Erro ao carregar templates'))
      .finally(() => setLoadingTemplates(false));
  }, []);

  useEffect(() => {
    if (preselectedId && templates.length > 0 && !templateId) {
      setTemplateId(
        templates.some((t) => t.id === preselectedId) ? preselectedId : templates[0].id
      );
    } else if (!templateId && templates.length > 0) {
      setTemplateId(templates[0].id);
    }
  }, [preselectedId, templates, templateId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateId) return;
    setError(null);
    setCreating(true);
    createSession(templateId)
      .then((session) => navigate(`/sessions/${session.id}/flow`))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao criar sessão');
        setCreating(false);
      });
  };

  if (loadingTemplates) {
    return (
      <div className="flex justify-center py-12">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <Card title="Nova sessão">
        <p className="text-content-muted">Nenhum template disponível. Crie um template primeiro.</p>
        <Link to="/templates/new" className="mt-4 inline-block">
          <Button>Criar template</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card title="Nova sessão">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-content-muted">Template</label>
          <select
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-content focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            required
          >
            <option value="">Selecione um template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-body-sm text-error">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" loading={creating} disabled={!templateId}>
            Iniciar sessão
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/sessions')}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
