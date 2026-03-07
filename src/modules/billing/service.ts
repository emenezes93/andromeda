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
  trialEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
} | null> {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, deletedAt: null },
    select: {
      subscriptionStatus: true,
      currentPeriodEnd: true,
      stripeSubscriptionId: true,
      trialEndsAt: true,
    },
  });
  if (!tenant) return null;

  let planLabel = 'Plano mensal';
  let planId: PlanId | null = 'monthly';
  let cancelAtPeriodEnd = false;
  if (tenant.stripeSubscriptionId) {
    const stripe = getStripe();
    if (stripe) {
      planLabel = await getPlanLabelFromStripe(stripe, tenant.stripeSubscriptionId);
      if (planLabel.includes('anual')) planId = 'annual';
      else if (planLabel.includes('semestral')) planId = 'semiannual';
      else planId = 'monthly';
      try {
        const sub = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
        cancelAtPeriodEnd = !!sub.cancel_at_period_end;
      } catch {
        // keep false
      }
    }
  } else {
    planId = null;
  }

  return {
    status: tenant.subscriptionStatus,
    currentPeriodEnd: tenant.currentPeriodEnd?.toISOString() ?? null,
    planId,
    planLabel,
    trialEndsAt: tenant.trialEndsAt?.toISOString() ?? null,
    cancelAtPeriodEnd,
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

/** Extract subscription ID from Stripe Invoice (compatible with Stripe v20 parent structure). */
function getInvoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const parent = invoice.parent as
    | { subscription_details?: { subscription?: string | { id: string } | null } | null }
    | null
    | undefined;
  const sub = parent?.subscription_details?.subscription;
  if (!sub) return null;
  return typeof sub === 'string' ? sub : sub.id;
}

/**
 * Suspends tenant access on payment failure.
 * The tenant record is updated with status 'past_due' so the application
 * can gate features while the subscription is delinquent.
 */
export async function handleInvoicePaymentFailed(
  prisma: PrismaClient,
  invoice: Stripe.Invoice
): Promise<void> {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const tenant = await prisma.tenant.findFirst({
    where: { stripeSubscriptionId: subscriptionId, deletedAt: null },
    select: { id: true },
  });
  if (!tenant) return;

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { subscriptionStatus: 'past_due' },
  });
}

/**
 * Restores tenant access when a previously failed invoice is successfully paid.
 */
export async function handleInvoicePaid(
  prisma: PrismaClient,
  invoice: Stripe.Invoice
): Promise<void> {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  const tenant = await prisma.tenant.findFirst({
    where: { stripeSubscriptionId: subscriptionId, deletedAt: null },
    select: { id: true, subscriptionStatus: true },
  });
  if (!tenant) return;

  // Only restore if it was previously past_due (avoid overwriting 'canceled' etc.)
  if (tenant.subscriptionStatus === 'past_due') {
    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { subscriptionStatus: 'active' },
    });
  }
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

export async function getInvoices(
  prisma: PrismaClient,
  tenantId: string
): Promise<InvoiceItem[] | { error: string }> {
  const stripe = getStripe();
  if (!stripe) return { error: 'Billing is not configured' };

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, deletedAt: null },
    select: { stripeCustomerId: true },
  });
  if (!tenant?.stripeCustomerId) return [];

  const invoices = await stripe.invoices.list({
    customer: tenant.stripeCustomerId,
    limit: 10,
  });

  return invoices.data.map((inv) => ({
    id: inv.id,
    date: inv.created ? new Date(inv.created * 1000).toISOString() : '',
    amount: inv.amount_paid ?? inv.amount_due ?? 0,
    currency: (inv.currency ?? 'brl').toUpperCase(),
    status: inv.status ?? 'draft',
    pdfUrl: inv.invoice_pdf ?? null,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
  }));
}

export async function changePlan(
  prisma: PrismaClient,
  tenantId: string,
  planId: PlanId
): Promise<{ status: string; currentPeriodEnd: string; planLabel: string } | { error: string }> {
  const stripe = getStripe();
  const priceId = getPriceIdForPlan(planId);
  if (!stripe || !priceId) return { error: 'Billing or plan not available' };

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, deletedAt: null },
    select: { stripeSubscriptionId: true },
  });
  if (!tenant?.stripeSubscriptionId) return { error: 'No active subscription' };

  const subscription = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId, {
    expand: ['items.data.price'],
  });
  const itemId = subscription.items?.data?.[0]?.id;
  if (!itemId) return { error: 'Subscription has no items' };

  await stripe.subscriptions.update(tenant.stripeSubscriptionId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: 'create_prorations',
  });

  const updated = await stripe.subscriptions.retrieve(tenant.stripeSubscriptionId);
  const periodEnd = (updated as { current_period_end?: number }).current_period_end;
  const planLabel = planId === 'annual' ? 'Plano anual' : planId === 'semiannual' ? 'Plano semestral' : 'Plano mensal';
  return {
    status: updated.status,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : '',
    planLabel,
  };
}

export async function cancelSubscription(
  prisma: PrismaClient,
  tenantId: string
): Promise<{ cancelAt: string } | { error: string }> {
  const stripe = getStripe();
  if (!stripe) return { error: 'Billing is not configured' };

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, deletedAt: null },
    select: { stripeSubscriptionId: true },
  });
  if (!tenant?.stripeSubscriptionId) return { error: 'No active subscription' };

  const sub = await stripe.subscriptions.update(tenant.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });
  const cancelAt = (sub as { current_period_end?: number }).current_period_end;
  return {
    cancelAt: cancelAt ? new Date(cancelAt * 1000).toISOString() : '',
  };
}

export async function reactivateSubscription(
  prisma: PrismaClient,
  tenantId: string
): Promise<{ status: string } | { error: string }> {
  const stripe = getStripe();
  if (!stripe) return { error: 'Billing is not configured' };

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId, deletedAt: null },
    select: { stripeSubscriptionId: true },
  });
  if (!tenant?.stripeSubscriptionId) return { error: 'No subscription found' };

  const sub = await stripe.subscriptions.update(tenant.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });
  return { status: sub.status };
}
