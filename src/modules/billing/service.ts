import Stripe from 'stripe';
import type { PrismaClient } from '@prisma/client';
import { env } from '@config/env.js';

export type PlanId = 'monthly' | 'semiannual' | 'annual';

export interface BillingPlan {
  id: PlanId;
  label: string;
  interval: 'month' | 'year';
  description: string;
}

export function isBillingEnabled(): boolean {
  return !!(env.STRIPE_SECRET_KEY && env.STRIPE_PRICE_ID && env.FRONTEND_URL);
}

function getStripe(): Stripe | null {
  if (!env.STRIPE_SECRET_KEY) return null;
  return new Stripe(env.STRIPE_SECRET_KEY);
}

function getPriceIdForPlan(planId: PlanId): string | null {
  if (planId === 'monthly') return env.STRIPE_PRICE_ID ?? null;
  if (planId === 'semiannual') return env.STRIPE_PRICE_ID_SEMIANNUAL ?? null;
  if (planId === 'annual') return env.STRIPE_PRICE_ID_ANNUAL ?? null;
  return null;
}

/** List available plans (only those with price ID configured). */
export function getPlans(): BillingPlan[] {
  const plans: BillingPlan[] = [];
  if (env.STRIPE_PRICE_ID) {
    plans.push({
      id: 'monthly',
      label: 'Plano mensal',
      interval: 'month',
      description: 'Cobrança mensal. Cancele quando quiser.',
    });
  }
  if (env.STRIPE_PRICE_ID_SEMIANNUAL) {
    plans.push({
      id: 'semiannual',
      label: 'Plano semestral',
      interval: 'month',
      description: 'Cobrança a cada 6 meses. Economia de 10% em relação ao plano mensal.',
    });
  }
  if (env.STRIPE_PRICE_ID_ANNUAL) {
    plans.push({
      id: 'annual',
      label: 'Plano anual',
      interval: 'year',
      description: '12 meses pelo preço de 10. Economia garantida.',
    });
  }
  return plans;
}

export async function createCheckoutSession(
  prisma: PrismaClient,
  tenantId: string,
  planId: PlanId,
  successPath: string,
  cancelPath: string
): Promise<{ url: string } | { error: string }> {
  const stripe = getStripe();
  const priceId = getPriceIdForPlan(planId);
  if (!stripe || !priceId || !env.FRONTEND_URL) {
    return { error: 'Billing is not configured or plan not available' };
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, deletedAt: null },
  });
  if (!tenant) return { error: 'Tenant not found' };

  let customerId = tenant.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      metadata: { tenantId },
    });
    customerId = customer.id;
    await prisma.tenant.update({
      where: { id: tenantId },
      data: { stripeCustomerId: customerId },
    });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.FRONTEND_URL}${successPath}`,
    cancel_url: `${env.FRONTEND_URL}${cancelPath}`,
    metadata: { tenantId, planId },
    subscription_data: { metadata: { tenantId, planId } },
  });

  const url = session.url;
  if (!url) return { error: 'Failed to create checkout session' };
  return { url };
}

export async function createPortalSession(
  prisma: PrismaClient,
  tenantId: string,
  returnPath: string
): Promise<{ url: string } | { error: string }> {
  const stripe = getStripe();
  if (!stripe || !env.FRONTEND_URL) return { error: 'Billing is not configured' };

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, deletedAt: null },
  });
  if (!tenant?.stripeCustomerId) return { error: 'No subscription to manage' };

  const session = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${env.FRONTEND_URL}${returnPath}`,
  });
  return { url: session.url };
}

/** Resolve plan label from Stripe subscription (interval). */
async function getPlanLabelFromStripe(stripe: Stripe, subscriptionId: string): Promise<string> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['items.data.price'],
    });
    const item = subscription.items?.data?.[0];
    const price = item?.price as { recurring?: { interval?: string; interval_count?: number } } | undefined;
    const interval = price?.recurring?.interval;
    const intervalCount = price?.recurring?.interval_count ?? 1;
    if (interval === 'year') return 'Plano anual';
    if (interval === 'month' && intervalCount === 6) return 'Plano semestral';
    return 'Plano mensal';
  } catch {
    return 'Plano mensal';
  }
}

export async function getSubscription(
  prisma: PrismaClient,
  tenantId: string
): Promise<{
  status: string | null;
  currentPeriodEnd: string | null;
  planId: PlanId | null;
  planLabel: string;
} | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, deletedAt: null },
    select: {
      subscriptionStatus: true,
      currentPeriodEnd: true,
      stripeSubscriptionId: true,
    },
  });
  if (!tenant) return null;

  let planLabel = 'Plano mensal';
  let planId: PlanId | null = 'monthly';
  if (tenant.stripeSubscriptionId) {
    const stripe = getStripe();
    if (stripe) {
      planLabel = await getPlanLabelFromStripe(stripe, tenant.stripeSubscriptionId);
      if (planLabel.includes('anual')) planId = 'annual';
      else if (planLabel.includes('semestral')) planId = 'semiannual';
      else planId = 'monthly';
    }
  } else {
    planId = null;
  }

  return {
    status: tenant.subscriptionStatus,
    currentPeriodEnd: tenant.currentPeriodEnd?.toISOString() ?? null,
    planId,
    planLabel,
  };
}

export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event | null {
  const secret = env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return null;
  try {
    return getStripe()!.webhooks.constructEvent(
      payload,
      signature,
      secret
    ) as Stripe.Event;
  } catch {
    return null;
  }
}

export async function handleSubscriptionUpdated(
  prisma: PrismaClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const tenantId = subscription.metadata?.tenantId as string | undefined;
  if (!tenantId) return;

  const status = subscription.status;
  const periodEndUnix = (subscription as { current_period_end?: number }).current_period_end;
  const periodEnd = periodEndUnix ? new Date(periodEndUnix * 1000) : null;

  await prisma.tenant.updateMany({
    where: { id: tenantId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: status,
      currentPeriodEnd: periodEnd,
    },
  });
}

export async function handleSubscriptionDeleted(
  prisma: PrismaClient,
  subscription: Stripe.Subscription
): Promise<void> {
  const tenantId = subscription.metadata?.tenantId as string | undefined;
  if (!tenantId) return;

  await prisma.tenant.updateMany({
    where: { id: tenantId },
    data: {
      stripeSubscriptionId: null,
      subscriptionStatus: 'canceled',
      currentPeriodEnd: null,
    },
  });
}
