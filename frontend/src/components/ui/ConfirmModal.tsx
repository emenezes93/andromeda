import {
  Dialog,
  DialogPanel,
  DialogTitle,
  DialogDescription,
  TransitionChild,
} from '@headlessui/react';
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
  if (!open) return null;

  const handleClose = () => {
    if (loading) return;
    onCancel();
  };

  return (
    <Dialog
      open={open}
      as="div"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClose={handleClose}
    >
      <TransitionChild
        enter="ease-out duration-200"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="ease-in duration-150"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="fixed inset-0 bg-content/50 backdrop-blur-sm" aria-hidden />
      </TransitionChild>

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <TransitionChild
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95 translate-y-2"
          enterTo="opacity-100 scale-100 translate-y-0"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 scale-100 translate-y-0"
          leaveTo="opacity-0 scale-95 translate-y-2"
        >
          <DialogPanel className="w-full max-w-md rounded-card border border-border bg-surface p-6 shadow-soft">
            <DialogTitle
              as="h2"
              id="confirm-modal-title"
              className="text-heading font-semibold text-content"
            >
              {title}
            </DialogTitle>
            <DialogDescription
              as="p"
              id="confirm-modal-desc"
              className="mt-2 text-body text-content-muted"
            >
              {message}
            </DialogDescription>
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
                variant={variant === 'danger' ? 'danger' : 'primary'}
                size="md"
                onClick={onConfirm}
                loading={loading}
                disabled={loading}
              >
                {confirmLabel}
              </Button>
            </div>
          </DialogPanel>
        </TransitionChild>
      </div>
    </Dialog>
  );
}
