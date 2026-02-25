const KEY = 'onboardingDismissed';

export function isOnboardingDismissed(): boolean {
  return localStorage.getItem(KEY) === 'true';
}

export function dismissOnboarding(): void {
  localStorage.setItem(KEY, 'true');
}
