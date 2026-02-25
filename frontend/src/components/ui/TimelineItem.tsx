import { Link } from 'react-router-dom';
import type { PatientTimelineEvent } from '@/types';
import { Badge } from './Badge';

interface TimelineItemProps {
  event: PatientTimelineEvent;
  isLast: boolean;
}

function EventIcon({ type }: { type: PatientTimelineEvent['type'] }) {
  if (type === 'session') {
    return (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  if (type === 'evolution') {
    return (
      <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    );
  }
  // goal
  return (
    <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function iconBg(type: PatientTimelineEvent['type']): string {
  if (type === 'session') return 'bg-primary/10 text-primary';
  if (type === 'evolution') return 'bg-success-light text-success';
  return 'bg-warning/10 text-warning';
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function TimelineItem({ event, isLast }: TimelineItemProps) {
  const content = (
    <div className="flex items-start gap-3 py-3">
      <div className={`flex size-8 shrink-0 items-center justify-center rounded-full ${iconBg(event.type)}`}>
        <EventIcon type={event.type} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-body font-medium text-content leading-snug">{event.title}</p>
          {event.badge && (
            <Badge variant={event.badgeVariant}>{event.badge}</Badge>
          )}
        </div>
        {event.subtitle && (
          <p className="mt-0.5 text-body-sm text-content-muted">{event.subtitle}</p>
        )}
        <p className="mt-1 text-body-sm text-content-subtle">{formatDate(event.date)}</p>
      </div>
    </div>
  );

  return (
    <div className="relative pl-4">
      {!isLast && (
        <div className="absolute left-7 top-11 bottom-0 w-px bg-border-muted" />
      )}
      {event.linkTo ? (
        <Link
          to={event.linkTo}
          className="block rounded-lg transition-calm hover:bg-surface-muted"
        >
          {content}
        </Link>
      ) : (
        <div>{content}</div>
      )}
    </div>
  );
}
