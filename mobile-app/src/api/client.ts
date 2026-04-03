const DEFAULT_TIMEOUT_MS = 30000;

const getBaseUrl = (): string => {
  // Configure EXPO_PUBLIC_API_URL no .env ou app.json (extra.apiUrl)
  // Emulador Android: http://10.0.2.2:3000 | Dispositivo: http://SEU_IP:3000
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  return 'http://10.0.2.2:3000';
};

let refreshCallback: (() => Promise<string | null>) | null = null;

/** Regista callback para refresh de token (chamado em 401). AuthProvider deve chamar isto. */
export function setApiRefreshCallback(cb: (() => Promise<string | null>) | null): void {
  refreshCallback = cb;
}

function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchInit } = init;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return fetch(url, { ...fetchInit, signal: controller.signal }).finally(() => clearTimeout(id));
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function apiFetch<T>(
  path: string,
  options: {
    method?: string;
    body?: BodyInit | null;
    token?: string | null;
    tenantId?: string | null;
    timeoutMs?: number;
    /** Número de novas tentativas em falha de rede (só GET). Default 2. */
    retries?: number;
  } = {}
): Promise<T> {
  const { method = 'GET', body, token, tenantId, timeoutMs = DEFAULT_TIMEOUT_MS, retries = 2 } = options;
  const url = `${getBaseUrl()}${path}`;
  const headers: Record<string, string> = {};
  if (!(typeof FormData !== 'undefined' && body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (tenantId) headers['x-tenant-id'] = tenantId;
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const doRequest = async (): Promise<Response> => {
    try {
      return await fetchWithTimeout(url, {
        method,
        headers: { ...headers },
        ...(body && { body }),
        timeoutMs,
      });
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('A requisição demorou muito. Verifique sua conexão e tente novamente.');
      }
      throw err;
    }
  };

  let res: Response | null = null;
  let lastErr: unknown;
  const maxAttempts = method === 'GET' && retries > 0 ? 1 + retries : 1;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      res = await doRequest();
      break;
    } catch (e) {
      lastErr = e;
      if (attempt < maxAttempts) await delay(1000);
    }
  }
  if (res == null) throw lastErr;

  if (res.status === 401 && refreshCallback && token) {
    const newToken = await refreshCallback();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      try {
        const retryRes = await fetchWithTimeout(url, {
          method,
          headers: { ...headers, Authorization: `Bearer ${newToken}` },
          ...(body && { body }),
          timeoutMs,
        });
        res = retryRes;
      } catch (retryErr) {
        if (retryErr instanceof Error && retryErr.name === 'AbortError') {
          throw new Error('A requisição demorou muito. Verifique sua conexão e tente novamente.');
        }
        throw retryErr;
      }
    }
  }

  if (!res.ok) {
    const text = await res.text();
    let message = `Erro ${res.status}`;
    if (res.status === 401) {
      message = 'Sua sessão expirou. Faça login novamente.';
    } else {
      try {
        const json = JSON.parse(text);
        message = json.message || json.error || message;
      } catch {
        if (text) message = text;
      }
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export { getBaseUrl };
