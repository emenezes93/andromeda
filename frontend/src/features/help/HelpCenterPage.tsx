import { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { HELP_ARTICLES, HELP_CATEGORIES, type HelpArticle } from './helpContent';
import { track } from '@/lib/analytics';

export function HelpCenterPage() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resolvedFeedback, setResolvedFeedback] = useState<Record<string, boolean>>({});

  useEffect(() => {
    track({ name: 'help_center_open' });
  }, []);

  // R2: abrir artigo pelo hash (ex.: /help#onde-encontro)
  useEffect(() => {
    const id = location.hash ? location.hash.slice(1) : null;
    if (id && HELP_ARTICLES.some((a) => a.id === id)) setSelectedId(id);
  }, [location.hash]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const byCategory = category
      ? HELP_ARTICLES.filter((a) => a.category === category)
      : HELP_ARTICLES;
    if (!q) return byCategory;
    return byCategory.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [search, category]);

  const selected = selectedId ? HELP_ARTICLES.find((a) => a.id === selectedId) : null;

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value.trim()) track({ name: 'help_center_search', query: value.trim() });
  };

  const handleSelect = (article: HelpArticle) => {
    setSelectedId(article.id);
    track({ name: 'help_article_view', articleId: article.id, category: article.category });
  };

  const handleResolved = (articleId: string, resolved: boolean) => {
    setResolvedFeedback((prev) => ({ ...prev, [articleId]: resolved }));
    track({ name: 'help_article_resolved', articleId, resolved });
    if (resolved) track({ name: 'help_helpful_yes', articleId });
    else track({ name: 'help_helpful_no', articleId });
  };

  const handleTicketCreated = (articleId?: string) => {
    track({ name: 'help_ticket_created', articleId, source: 'help_center' });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-heading font-semibold text-content">Central de ajuda</h1>
        <p className="mt-1 text-body text-content-muted">
          Encontre respostas para as dúvidas mais comuns. Use a busca ou navegue por categoria.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Buscar na central de ajuda…"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Buscar artigos"
            className="w-full"
          />
        </div>
        <select
          className="min-h-touch rounded-button border border-border bg-surface px-3 py-2 text-body-sm text-content focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filtrar por categoria"
        >
          <option value="">Todas as categorias</option>
          {HELP_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card padding="md">
            <h2 className="text-body font-semibold text-content mb-3">Artigos</h2>
            {filtered.length === 0 ? (
              <p className="text-body-sm text-content-muted">
                Nenhum artigo encontrado para essa busca ou categoria.
              </p>
            ) : (
              <ul className="space-y-1">
                {filtered.map((article) => (
                  <li key={article.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(article)}
                      className={`w-full rounded-button px-3 py-2 text-left text-body-sm transition-calm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        selectedId === article.id
                          ? 'bg-primary-subtle font-medium text-primary'
                          : 'text-content hover:bg-surface-muted'
                      }`}
                    >
                      {article.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selected ? (
            <Card padding="md">
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-heading-sm font-semibold text-content">{selected.title}</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
                  Fechar
                </Button>
              </div>
              <p className="mt-2 text-body text-content whitespace-pre-wrap">{selected.body}</p>
              <div className="mt-4 pt-4 border-t border-border-muted">
                <p className="text-body-sm font-medium text-content-muted mb-2">
                  Isso resolveu sua dúvida?
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={resolvedFeedback[selected.id] === true ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleResolved(selected.id, true)}
                  >
                    Sim
                  </Button>
                  <Button
                    variant={resolvedFeedback[selected.id] === false ? 'secondary' : 'outline'}
                    size="sm"
                    onClick={() => handleResolved(selected.id, false)}
                  >
                    Não
                  </Button>
                </div>
                {resolvedFeedback[selected.id] === false && (
                  <p className="mt-2 text-body-sm text-content-muted">
                    <a
                      href={`mailto:${import.meta.env.VITE_SUPPORT_EMAIL ?? 'suporte@exemplo.com'}?subject=Suporte%20-%20Central%20de%20ajuda`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-button"
                      onClick={() => handleTicketCreated(selected.id)}
                    >
                      Contatar suporte
                    </a>
                    {' — envie sua dúvida e retornaremos em breve.'}
                  </p>
                )}
                {resolvedFeedback[selected.id] !== undefined && resolvedFeedback[selected.id] !== false && (
                  <p className="mt-2 text-body-sm text-content-muted">
                    Obrigado pelo feedback.
                  </p>
                )}
              </div>
            </Card>
          ) : (
            <Card padding="md">
              <p className="text-content-muted">
                Selecione um artigo na lista ao lado para ler o conteúdo. Se não encontrar o que
                precisa, entre em contato com o suporte da sua organização.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
