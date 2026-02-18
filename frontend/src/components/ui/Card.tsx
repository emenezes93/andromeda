import type { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
}

export function Card({ title, children, className = '', ...props }: CardProps) {
  return (
    <div
      className={`rounded-card border border-border bg-surface shadow-card ${className}`}
      {...props}
    >
      {title && (
        <div className="border-b border-border-muted px-5 py-4">
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
