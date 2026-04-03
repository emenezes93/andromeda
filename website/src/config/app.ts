const base = typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL
  ? String(import.meta.env.VITE_APP_URL).replace(/\/$/, '')
  : '';

export function getAppUrl(): string {
  return base;
}

export function getLoginUrl(): string {
  return base ? `${base}/login` : '#';
}

export function getSignupUrl(): string {
  return base ? `${base}/signup` : '#';
}

export function getDemoUrl(): string {
  const email = typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONTACT_EMAIL
    ? String(import.meta.env.VITE_CONTACT_EMAIL)
    : 'contato@fitinsight.com.br';
  return `mailto:${email}?subject=Agendar demo - Fit Insight`;
}

/** Link para contato comercial (ex.: plano Pro "Falar com vendas"). */
export function getContactUrl(): string {
  const email = typeof import.meta !== 'undefined' && import.meta.env?.VITE_CONTACT_EMAIL
    ? String(import.meta.env.VITE_CONTACT_EMAIL)
    : 'contato@fitinsight.com.br';
  return `mailto:${email}?subject=Contato comercial - plano Pro`;
}
