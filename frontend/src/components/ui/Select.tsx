import { forwardRef, type SelectHTMLAttributes } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, id, options, className = '', ...props }, ref) => {
    const selectId = id || props.name;
    const hasError = !!error;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="mb-1.5 block text-body-sm font-medium text-content-muted"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`min-h-touch w-full rounded-input border bg-surface px-3 py-2.5 text-body text-content transition-calm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
            hasError
              ? 'border-error focus:border-error focus:ring-error/20'
              : 'border-border'
          } ${className}`}
          aria-invalid={hasError}
          aria-describedby={hint ? `${selectId}-hint` : error ? `${selectId}-error` : undefined}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {hint && !error && (
          <p id={`${selectId}-hint`} className="mt-1.5 text-body-sm text-content-subtle">
            {hint}
          </p>
        )}
        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-body-sm text-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
