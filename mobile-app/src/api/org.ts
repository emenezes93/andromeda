import { apiFetch } from './client';

/** Resposta de GET /v1/org/branding — F6.5 white-label. */
export interface BrandingResponse {
  primaryColor?: string | null;
  appName?: string | null;
  logoUrl?: string | null;
}

/** Carrega branding da organização (tema dinâmico). Não exige recompilação. */
export async function getBranding(
  token: string,
  tenantId: string
): Promise<BrandingResponse> {
  try {
    return await apiFetch<BrandingResponse>('/v1/org/branding', { token, tenantId });
  } catch {
    return {};
  }
}
