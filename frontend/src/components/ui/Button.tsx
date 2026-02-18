import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'tactile';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover active:opacity-95',
  secondary: 'border border-border-soft bg-surface text-content hover:bg-surface-muted',
  ghost: 'text-content-muted hover:bg-primary-light hover:text-content',
  outline: 'border-2 border-primary text-primary bg-transparent hover:bg-primary-light',
  tactile:
    'bg-primary text-white hover:bg-primary-hover btn-texture btn-tactile shadow-soft',
};

const sizeClasses = {
  sm: 'min-h-[36px] px-3 py-1.5 text-body-sm',
  md: 'min-h-touch px-4 py-2.5 text-body-sm',
  lg: 'min-h-[48px] px-5 py-3 text-body',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className = '',
  children,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center rounded-button font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';
  const motionClass = variant === 'tactile' ? '' : 'transition-calm';

  return (
    <button
      type="button"
      className={`${base} ${motionClass} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : (
        children
      )}
    </button>
  );
}
