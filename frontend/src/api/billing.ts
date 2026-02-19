import { apiFetch } from './client';

export type PlanId = 'monthly' | 'semiannual' | 'annual';

export interface BillingPlan {
  id: PlanId;
  label: string;
  interval: 'month' | 'year';
  description: string;
}

export interface SubscriptionInfo {
  status: string | null;
  currentPeriodEnd: string | null;
  planId: PlanId | null;
  planLabel: string;
}

export async function getPlans(): Promise<BillingPlan[]> {
  return apiFetch<BillingPlan[]>('/v1/billing/plans');
}

export async function getSubscription(): Promise<SubscriptionInfo> {
  return apiFetch<SubscriptionInfo>('/v1/billing/subscription');
}

export async function createCheckout(
  planId: PlanId,
  successPath?: string,
  cancelPath?: string
): Promise<{ url: string }> {
  return apiFetch<{ url: string }>('/v1/billing/checkout', {
    method: 'POST',
    body: JSON.stringify({
      planId,
      successPath: successPath ?? '/subscription?success=1',
      cancelPath: cancelPath ?? '/subscription?canceled=1',
    }),
  });
}

export async function createPortal(returnPath?: string): Promise<{ url: string }> {
  return apiFetch<{ url: string }>('/v1/billing/portal', {
    method: 'POST',
    body: JSON.stringify({
      returnPath: returnPath ?? '/subscription',
    }),
  });
}
