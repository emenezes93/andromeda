import { ArrowRight } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'outline' | 'dark' | 'white';
type Size = 'sm' | 'md' | 'lg';

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/30 border-0',
  secondary:
    'bg-surface-muted text-dark hover:bg-border border border-border',
  outline:
    'bg-transparent text-dark border border-border hover:border-dark-soft',
  dark:
    'bg-dark text-white hover:bg-dark-muted border-0',
  white:
    'bg-white text-dark shadow-lg shadow-black/10 hover:bg-white/90 border-0',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-5 py-2 text-body-sm min-h-[44px] gap-1.5',
  md: 'px-5 py-3 text-body-sm min-h-[48px] gap-2',
  lg: 'px-7 py-3.5 text-body min-h-[48px] gap-2 sm:px-8 sm:py-4',
};

export interface ButtonProps {
  variant?: Variant;
  size?: Size;
  href?: string;
  icon?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  'aria-label'?: string;
}

export function Button({
  variant = 'primary',
  size = 'md',
  href,
  icon = false,
  children,
  className = '',
  onClick,
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const base =
    'group inline-flex items-center justify-center rounded-full font-semibold transition-all hover:-translate-y-0.5';
  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  if (href) {
    return (
      <a
        href={href}
        className={classes}
        onClick={onClick}
        aria-label={ariaLabel}
      >
        {children}
        {icon && <ArrowRight size={size === 'sm' ? 13 : size === 'md' ? 14 : 16} className="shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden />}
      </a>
    );
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
      {icon && <ArrowRight size={size === 'sm' ? 13 : size === 'md' ? 14 : 16} className="shrink-0 group-hover:translate-x-0.5 transition-transform" aria-hidden />}
    </button>
  );
}
