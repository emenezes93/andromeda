import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  /** CTA (e.g. Button or Link) shown below description */
  action?: ReactNode;
  className?: string;
}

/**
 * Padrão de estado vazio para listas e seções.
 * Use em listas sem resultados, filtros sem match, etc.
 */
export function EmptyState({ title, description, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`rounded-card border border-border bg-surface-muted/50 px-5 py-8 text-center ${className}`}
      role="status"
      aria-label={title}
    >
      <p className="text-body font-medium text-content">{title}</p>
      {description && (
        <p className="mt-1 text-body-sm text-content-muted">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
