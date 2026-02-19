import { Skeleton } from './Skeleton';

export function SkeletonCard() {
  return (
    <div className="rounded-card border border-border bg-surface p-4" aria-label="Carregando...">
      <Skeleton height={20} width="60%" className="mb-3" />
      <Skeleton height={16} width="100%" className="mb-2" />
      <Skeleton height={16} width="80%" />
    </div>
  );
}

export function SkeletonCardGrid({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto rounded-card border border-border bg-surface" aria-label="Carregando tabela...">
      <div className="p-4">
        {/* Header */}
        <div className="mb-4 flex gap-4" role="rowheader">
          <Skeleton height={16} width="20%" />
          <Skeleton height={16} width="25%" />
          <Skeleton height={16} width="20%" />
          <Skeleton height={16} width="15%" />
          <Skeleton height={16} width="20%" />
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="mb-3 flex gap-4 border-b border-border-muted pb-3 last:mb-0 last:border-0" role="row">
            <Skeleton height={16} width="20%" />
            <Skeleton height={16} width="25%" />
            <Skeleton height={16} width="20%" />
            <Skeleton height={16} width="15%" />
            <Skeleton height={16} width="20%" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonDetail() {
  return (
    <div className="space-y-6" aria-label="Carregando detalhes...">
      {/* Header */}
      <div className="space-y-2">
        <Skeleton height={32} width="40%" />
        <Skeleton height={16} width="60%" />
      </div>
      {/* Content */}
      <div className="space-y-4">
        <Skeleton height={200} width="100%" rounded="lg" />
        <div className="space-y-2">
          <Skeleton height={16} width="100%" />
          <Skeleton height={16} width="95%" />
          <Skeleton height={16} width="90%" />
        </div>
      </div>
    </div>
  );
}
