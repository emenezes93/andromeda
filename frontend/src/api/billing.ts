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
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
}

export interface InvoiceItem {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: string;
  pdfUrl: string | null;
  hostedInvoiceUrl: string | null;
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

export async function getInvoices(): Promise<InvoiceItem[]> {
  return apiFetch<InvoiceItem[]>('/v1/billing/invoices');
}

export async function changePlan(planId: PlanId): Promise<{
  status: string;
  currentPeriodEnd: string;
  planLabel: string;
}> {
  return apiFetch<{ status: string; currentPeriodEnd: string; planLabel: string }>(
    '/v1/billing/change-plan',
    { method: 'POST', body: JSON.stringify({ planId }) }
  );
}

export async function cancelSubscription(): Promise<{ cancelAt: string }> {
  return apiFetch<{ cancelAt: string }>('/v1/billing/cancel', { method: 'POST' });
}

export async function reactivateSubscription(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/v1/billing/reactivate', { method: 'POST' });
}
