const KEY_DISMISSED = 'onboardingDismissed';
const KEY_STEP = 'onboardingStep';

export function isOnboardingDismissed(): boolean {
  return localStorage.getItem(KEY_DISMISSED) === 'true';
}

export function dismissOnboarding(): void {
  localStorage.setItem(KEY_DISMISSED, 'true');
  localStorage.removeItem(KEY_STEP);
}

/** Índice do passo atual (0-based). Usado para retomar de onde parou. */
export function getOnboardingStep(): number {
  const raw = localStorage.getItem(KEY_STEP);
  if (raw === null) return 0;
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? Math.min(n, 99) : 0;
}

export function setOnboardingStep(stepIndex: number): void {
  localStorage.setItem(KEY_STEP, String(Math.max(0, stepIndex)));
}

const KEY_CTA_DISMISSED_AT = 'onboardingCtaDismissedAt';
const CTA_DISMISS_DAYS = 7;

/** Exibe CTA "Complete sua configuração" no dashboard quando onboarding foi pulado. Respeita dismiss por 7 dias. */
export function shouldShowOnboardingCta(): boolean {
  if (!isOnboardingDismissed()) return false;
  try {
    const raw = localStorage.getItem(KEY_CTA_DISMISSED_AT);
    if (!raw) return true;
    const at = parseInt(raw, 10);
    if (!Number.isFinite(at)) return true;
    const elapsed = (Date.now() - at) / (24 * 60 * 60 * 1000);
    return elapsed > CTA_DISMISS_DAYS;
  } catch {
    return true;
  }
}

export function dismissOnboardingCta(): void {
  try {
    localStorage.setItem(KEY_CTA_DISMISSED_AT, String(Date.now()));
  } catch {}
}
