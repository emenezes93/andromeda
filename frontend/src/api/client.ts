import { getApiErrorHandler } from './globalErrorHandler';

const API_URL = import.meta.env.VITE_API_URL || '';

function getAuthHeaders(skipAuth = false): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (skipAuth) return headers;
  const token = localStorage.getItem('token');
  const tenantId = localStorage.getItem('tenantId');
  if (token) (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  if (tenantId) (headers as Record<string, string>)['x-tenant-id'] = tenantId;
  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const url = path.startsWith('http') ? path : `${API_URL}${path}`;
  const res = await fetch(url, {
    ...fetchOptions,
    headers: {
      ...getAuthHeaders(skipAuth),
      ...(fetchOptions.headers as Record<string, string>),
    },
  });

  if (res.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshRes = await fetch(`${API_URL}/v1/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('token', data.token);
          localStorage.setItem('refreshToken', data.refreshToken);
          return apiFetch(path, options);
        }
      } catch {
        // fall through to clear auth
      }
    }
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('tenantId');
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
    const msg = err.error ?? err.message ?? res.statusText ?? `Erro ${res.status}`;
    const notify = getApiErrorHandler();
    if (notify && (res.status === 403 || res.status === 404 || res.status >= 500)) {
      const friendly =
        res.status === 403
          ? 'Ação não permitida.'
          : res.status === 404
            ? 'Recurso não encontrado.'
            : res.status >= 500
              ? 'Erro no servidor. Tente novamente mais tarde.'
              : msg;
      notify(friendly, 'error');
    }
    throw new Error(msg);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}
