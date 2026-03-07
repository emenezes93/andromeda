import { posthogClient } from './posthog';

export type AnalyticsEvent =
  | { name: 'onboarding_started' }
  | { name: 'onboarding_step_view'; stepId: string; stepIndex: number }
  | { name: 'onboarding_step_skip'; stepId: string; stepIndex: number }
  | { name: 'onboarding_step_complete'; stepId: string; stepIndex: number }
  | { name: 'onboarding_finish'; completedAll: boolean }
  | { name: 'onboarding_resume'; fromStepIndex: number }
  | { name: 'questionnaire_start'; sessionId: string }
  | { name: 'questionnaire_progress'; sessionId: string; completionPercent: number }
  | { name: 'questionnaire_complete'; sessionId: string }
  | { name: 'form_submit_success'; formId: string; action?: string }
  | { name: 'form_submit_error'; formId: string; action?: string }
  | { name: 'action_critical_success'; action: string; context?: string }
  | { name: 'action_critical_error'; action: string; context?: string }
  | { name: 'dashboard_first_action'; actionType: string; targetId?: string }
  | { name: 'next_actions_viewed'; count: number }
  | { name: 'help_center_open' }
  | { name: 'help_center_search'; query: string }
  | { name: 'help_article_view'; articleId: string; category?: string }
  | { name: 'help_article_resolved'; articleId: string; resolved: boolean }
  | { name: 'nav_item_clicked'; item: string; origin: 'sidebar' | 'mobile' }
  | { name: 'page_viewed'; route: string; context?: string }
  | { name: 'tour_started'; tourId: string }
  | { name: 'tour_completed'; tourId: string }
  | { name: 'tour_skipped'; tourId: string }
  // R3 — Escala e Autonomia: listas, filtros, busca, help center deflection
  | { name: 'list_loaded'; listType: string; ms: number; size: number; page: number }
  | { name: 'filter_applied'; listType: string; filterType: string; count: number }
  | { name: 'search_performed'; listType: string; success: boolean }
  | { name: 'help_helpful_yes'; articleId: string }
  | { name: 'help_helpful_no'; articleId: string }
  | { name: 'help_ticket_created'; articleId?: string; source: string }
  // Fase 3 — Inteligência e diferenciação
  | { name: 'signup_complete'; tenantId: string }
  | { name: 'patient_created'; patientId: string }
  | { name: 'training_plan_created'; planId: string; patientId: string }
  | { name: 'evolution_recorded'; patientId: string }
  | { name: 'report_exported'; format: 'pdf' | 'print'; patientId: string }
  | { name: 'exercise_added_from_library'; exerciseId: string }
  | { name: 'plan_duplicated'; sourceId: string; targetPatientId: string }
  | { name: 'alert_action_clicked'; alertType: string; alertId: string }
  | { name: 'analytics_dashboard_viewed'; periodDays: number }
  | { name: 'goal_created'; goalId: string; type: string }
  | { name: 'diet_plan_created'; planId: string; patientId: string }
  | { name: 'patients_imported'; count: number }
  | { name: 'settings_updated' };

export type FunnelStep =
  | 'onboarding_start'
  | 'onboarding_step_1'
  | 'onboarding_step_2'
  | 'onboarding_step_3'
  | 'onboarding_step_4'
  | 'onboarding_complete'
  | 'questionnaire_start'
  | 'questionnaire_complete';

const isDev = import.meta.env.DEV;

export function track(event: AnalyticsEvent): void {
  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug('[analytics]', event.name, event);
  }
  if (posthogClient) {
    posthogClient.capture(event.name, event as Record<string, unknown>);
  }
}

export function trackFunnel(step: FunnelStep, props?: Record<string, unknown>): void {
  const payload = { step, ...props };
  if (isDev) {
    // eslint-disable-next-line no-console
    console.debug('[analytics funnel]', payload);
  }
  if (posthogClient) {
    posthogClient.capture('funnel_step', payload);
  }
}

export function identifyUser(userId: string, traits: Record<string, unknown>): void {
  if (posthogClient) {
    posthogClient.identify(userId, traits);
  }
}

export function resetAnalytics(): void {
  if (posthogClient) {
    posthogClient.reset();
  }
}
