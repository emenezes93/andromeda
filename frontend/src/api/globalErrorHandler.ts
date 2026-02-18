/**
 * Handler global para erros de API (403, 404, 5xx).
 * Registrado pelo ToastProvider no mount; apiFetch chama antes de lançar.
 */
type ApiErrorHandler = (message: string, variant?: 'error' | 'info') => void;

let handler: ApiErrorHandler | null = null;

export function setApiErrorHandler(h: ApiErrorHandler | null): void {
  handler = h;
}

export function getApiErrorHandler(): ApiErrorHandler | null {
  return handler;
}
