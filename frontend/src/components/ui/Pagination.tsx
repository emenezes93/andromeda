/**
 * Paginação reutilizável (M6 — Fase 3).
 * Uso: listas com meta.totalPages; a11y e loading consistentes.
 */

import { Button } from './Button';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  /** Rótulo para aria (ex.: "lista de pacientes") */
  label?: string;
  /** Texto "Anterior" / "Próxima" — pode vir de i18n depois */
  prevLabel?: string;
  nextLabel?: string;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
  loading = false,
  label = 'lista',
  prevLabel = 'Anterior',
  nextLabel = 'Próxima',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      aria-label={`Paginação da ${label}`}
      className="flex items-center justify-center gap-2"
    >
      <Button
        variant="secondary"
        disabled={page <= 1 || loading}
        onClick={() => onPageChange(page - 1)}
        aria-label={`${prevLabel}, página ${page - 1}`}
      >
        {prevLabel}
      </Button>
      <span className="min-w-[7rem] text-center text-body-sm text-content-muted" aria-live="polite">
        Página {page} de {totalPages}
      </span>
      <Button
        variant="secondary"
        disabled={page >= totalPages || loading}
        onClick={() => onPageChange(page + 1)}
        aria-label={`${nextLabel}, página ${page + 1}`}
      >
        {nextLabel}
      </Button>
    </nav>
  );
}
