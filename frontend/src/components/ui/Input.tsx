import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = '', ...props }, ref) => {
    const inputId = id || props.name;
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="mb-1.5 block text-body-sm font-medium text-content-muted"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`min-h-touch w-full rounded-input border bg-surface px-3 py-2.5 text-body text-content placeholder-content-subtle transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            hasError
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-border'
          } ${className}`}
          aria-invalid={hasError}
          aria-describedby={hint ? `${inputId}-hint` : error ? `${inputId}-error` : undefined}
          {...props}
        />
        {hint && !error && (
          <p id={`${inputId}-hint`} className="mt-1.5 text-body-sm text-content-subtle">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-body-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
