import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { setApiErrorHandler } from '@/api/globalErrorHandler';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastVariant = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

export interface ToastContextValue {
  addToast: (message: string, variant?: ToastVariant) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  warning: (message: string) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue | null>(null);

// ---------------------------------------------------------------------------
// Variant config
// ---------------------------------------------------------------------------

const VARIANT_CONFIG: Record<
  ToastVariant,
  { borderClass: string; icon: string; iconClass: string; label: string }
> = {
  success: {
    borderClass: 'border-success',
    icon: '✓',
    iconClass: 'text-success',
    label: 'Success',
  },
  error: {
    borderClass: 'border-error',
    icon: '✕',
    iconClass: 'text-error',
    label: 'Error',
  },
  info: {
    borderClass: 'border-primary',
    icon: 'ℹ',
    iconClass: 'text-primary',
    label: 'Info',
  },
  warning: {
    borderClass: 'border-warning',
    icon: '⚠',
    iconClass: 'text-warning',
    label: 'Warning',
  },
};

// ---------------------------------------------------------------------------
// ToastItem
// ---------------------------------------------------------------------------

interface ToastItemProps {
  toast: Toast;
  onDismiss: (id: string) => void;
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [visible, setVisible] = useState(false);

  // Trigger slide-in on mount
  useEffect(() => {
    // A tiny delay allows the CSS transition to fire after the element is in the DOM
    const enterTimer = requestAnimationFrame(() => {
      setVisible(true);
    });
    return () => cancelAnimationFrame(enterTimer);
  }, []);

  const config = VARIANT_CONFIG[toast.variant];

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-label={config.label}
      style={{
        minWidth: '280px',
        maxWidth: '400px',
        transition: 'opacity 300ms ease, transform 300ms ease',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
      }}
      className={[
        'flex items-start gap-3',
        'bg-surface shadow-soft rounded-card',
        'border-l-4',
        config.borderClass,
        'px-4 py-3',
      ].join(' ')}
    >
      {/* Icon */}
      <span
        className={['mt-0.5 text-base font-bold select-none', config.iconClass].join(' ')}
        aria-hidden="true"
      >
        {config.icon}
      </span>

      {/* Message */}
      <p className="flex-1 text-sm text-content leading-snug break-words">
        {toast.message}
      </p>

      {/* Close button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="ml-1 -mr-1 -mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-content-muted hover:text-content hover:bg-surface-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        aria-label="Dismiss notification"
      >
        <span aria-hidden="true" className="text-lg leading-none">
          ×
        </span>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ToastContainer — rendered into a portal
// ---------------------------------------------------------------------------

interface ToastContainerProps {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return createPortal(
    <div
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>,
    document.body,
  );
}

// ---------------------------------------------------------------------------
// ToastProvider
// ---------------------------------------------------------------------------

interface ToastProviderProps {
  children: React.ReactNode;
  /** Auto-dismiss delay in ms. Defaults to 4000. */
  duration?: number;
}

export function ToastProvider({ children, duration = 4000 }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = Date.now().toString();
      const newToast: Toast = { id, message, variant };

      setToasts((prev) => [...prev, newToast]);

      setTimeout(() => {
        dismiss(id);
      }, duration);
    },
    [dismiss, duration],
  );

  const success = useCallback(
    (message: string) => addToast(message, 'success'),
    [addToast],
  );
  const error = useCallback(
    (message: string) => addToast(message, 'error'),
    [addToast],
  );
  const info = useCallback(
    (message: string) => addToast(message, 'info'),
    [addToast],
  );
  const warning = useCallback(
    (message: string) => addToast(message, 'warning'),
    [addToast],
  );

  const value: ToastContextValue = { addToast, success, error, info, warning };

  useEffect(() => {
    setApiErrorHandler((message) => addToast(message, 'error'));
    return () => setApiErrorHandler(null);
  }, [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// useToast hook
// ---------------------------------------------------------------------------

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a <ToastProvider>.');
  }
  return ctx;
}
