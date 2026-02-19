import { useEffect } from 'react';
import { Button } from './Button';

export interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'default';
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'default',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass =
    variant === 'danger'
      ? 'bg-error text-white hover:bg-error/90 focus-visible:ring-error'
      : 'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
    >
      <div
        className="absolute inset-0 bg-content/50 backdrop-blur-sm"
        aria-hidden
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-lg">
        <h2 id="confirm-modal-title" className="text-heading font-semibold text-content">
          {title}
        </h2>
        <p id="confirm-modal-desc" className="mt-2 text-body text-content-muted">
          {message}
        </p>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <Button
            variant="outline"
            size="md"
            onClick={onCancel}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            size="md"
            className={confirmClass}
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
