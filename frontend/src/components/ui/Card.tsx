import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  padding?: 'none' | 'sm' | 'md';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
};

export function Card({
  title,
  padding = 'md',
  children,
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-card border border-border bg-surface shadow-card transition-calm hover:shadow-card-hover ${className}`}
      {...props}
    >
      {title && (
        <div className="border-b border-border-muted px-5 py-4">
          <h3 className="text-body font-semibold text-content">{title}</h3>
        </div>
      )}
      <div className={paddingClasses[padding]}>{children}</div>
    </div>
  );
}
