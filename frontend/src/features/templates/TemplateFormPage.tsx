import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createTemplate } from '@/api/templates';
import type { CreateTemplateBody } from '@/api/templates';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

const DEFAULT_SCHEMA: CreateTemplateBody['schemaJson'] = {
  questions: [
    {
      id: 'q1',
      text: 'Qualidade do sono (1-10)?',
      type: 'number',
      required: true,
      tags: ['sleep'],
    },
    {
      id: 'q2',
      text: 'Nível de estresse (1-10)?',
      type: 'number',
      required: true,
      tags: ['stress'],
    },
  ],
};

export function TemplateFormPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [schemaJson, setSchemaJson] = useState<string>(JSON.stringify(DEFAULT_SCHEMA, null, 2));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let parsed: CreateTemplateBody['schemaJson'];
    try {
      parsed = JSON.parse(schemaJson) as CreateTemplateBody['schemaJson'];
    } catch {
      setError('JSON do schema inválido.');
      return;
    }
    if (!name.trim()) {
      setError('Nome é obrigatório.');
      return;
    }
    setLoading(true);
    createTemplate({ name: name.trim(), schemaJson: parsed })
      .then((t) => navigate(`/templates/${t.id}`))
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Erro ao criar template');
        setLoading(false);
      });
  };

  return (
    <Card title="Novo template">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Anamnese inicial"
          required
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Schema (JSON)</label>
          <textarea
            className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 font-mono text-sm text-slate-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            rows={14}
            value={schemaJson}
            onChange={(e) => setSchemaJson(e.target.value)}
            spellCheck={false}
          />
          <p className="mt-1 text-xs text-slate-500">
            Objeto com <code className="rounded bg-slate-100 px-1">questions</code> (array de
            perguntas com id, text, type, required, tags).
          </p>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" loading={loading}>
            Criar template
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/templates')}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  );
}
