import type { SessionStatus } from '@/types';
import { Badge } from './Badge';

const statusConfig: Record<
  SessionStatus,
  { label: string; variant: 'default' | 'primary' | 'success' | 'warning' | 'error' }
> = {
  pending: { label: 'Pendente', variant: 'default' },
  in_progress: { label: 'Em andamento', variant: 'primary' },
  completed: { label: 'Concluída', variant: 'success' },
  cancelled: { label: 'Cancelada', variant: 'error' },
};

interface SessionStatusBadgeProps {
  status: SessionStatus | string;
  className?: string;
}

export function SessionStatusBadge({ status, className }: SessionStatusBadgeProps) {
  const config = statusConfig[status as SessionStatus] ?? { label: status, variant: 'default' as const };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}
