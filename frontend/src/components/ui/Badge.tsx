import type { HTMLAttributes } from 'react';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error';
}

const variantClasses = {
  default: 'bg-surface-muted text-content-muted border-border',
  primary: 'bg-primary-subtle text-primary border-primary-light',
  success: 'bg-success-light text-success border-success',
  warning: 'bg-warning-light text-warning border-warning',
  error: 'bg-error-light text-error border-error',
};

export function Badge({
  variant = 'default',
  className = '',
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex min-h-[24px] items-center rounded-button border px-2 py-0.5 text-body-sm font-medium transition-calm ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
