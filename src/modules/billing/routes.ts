import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import Stripe from 'stripe';
import { requireTenant } from '@http/middleware/tenant.js';
import { requireAuth } from '@http/middleware/auth.js';
import { requireRole } from '@shared/utils/rbac.js';
import { BadRequestError } from '@shared/errors/index.js';
import { auditLog } from '@shared/utils/audit.js';
import {
  isBillingEnabled,
  getPlans,
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  getInvoices,
  changePlan,
  cancelSubscription,
  reactivateSubscription,
  constructWebhookEvent,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaymentFailed,
  handleInvoicePaid,
} from './service.js';

export async function billingRoutes(fastify: FastifyInstance): Promise<void> {
  // List available plans (monthly, annual)
  fastify.get(
    '/v1/billing/plans',
    {
      schema: {
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string', enum: ['monthly', 'semiannual', 'annual'] },
                label: { type: 'string' },
                interval: { type: 'string', enum: ['month', 'year'] },
                description: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      requireTenant(request);
      requireAuth(request);
      const plans = getPlans();
      return reply.status(200).send(plans);
    }
  );

  // Checkout: create Stripe Checkout Session (subscription) for a given plan
  fastify.post(
    '/v1/billing/checkout',
    {
      schema: {
        body: {
          type: 'object',
          required: ['planId'],
          properties: {
            planId: { type: 'string', enum: ['monthly', 'semiannual', 'annual'] },
            successPath: { type: 'string', default: '/subscription?success=1' },
            cancelPath: { type: 'string', default: '/subscription?canceled=1' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: { url: { type: 'string' } },
          },
          400: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
          503: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      requireRole(user.role, 'admin');

      if (!isBillingEnabled()) {
        return reply.status(503).send({ error: 'Billing is not configured' });
      }

      const body = request.body as { planId?: string; successPath?: string; cancelPath?: string };
      const planId = body.planId as 'monthly' | 'semiannual' | 'annual' | undefined;
      if (!planId || (planId !== 'monthly' && planId !== 'semiannual' && planId !== 'annual')) {
        return reply.status(400).send({ error: 'planId must be monthly, semiannual, or annual' });
      }

      const result = await createCheckoutSession(
        fastify.prisma,
        tenantId,
        planId,
        body.successPath ?? '/subscription?success=1',
        body.cancelPath ?? '/subscription?canceled=1'
      );

      if ('error' in result) {
        const status = result.error.includes('not available') ? 400 : 503;
        return reply.status(status).send({ error: result.error });
      }
      return reply.status(200).send({ url: result.url });
    }
  );

  // Portal: create Stripe Customer Portal session (manage subscription)
  fastify.post(
    '/v1/billing/portal',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            returnPath: { type: 'string', default: '/subscription' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: { url: { type: 'string' } },
          },
          503: {
            type: 'object',
            properties: { error: { type: 'string' } },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      requireRole(user.role, 'admin');

      if (!isBillingEnabled()) {
        return reply.status(503).send({ error: 'Billing is not configured' });
      }

      const body = (request.body as { returnPath?: string }) ?? {};
      const result = await createPortalSession(
        fastify.prisma,
        tenantId,
        body.returnPath ?? '/subscription'
      );

      if ('error' in result) {
        return reply.status(503).send({ error: result.error });
      }
      return reply.status(200).send({ url: result.url });
    }
  );

  // Get current subscription for tenant
  fastify.get(
    '/v1/billing/subscription',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string', nullable: true },
              currentPeriodEnd: { type: 'string', nullable: true },
              planId: { type: 'string', nullable: true },
              planLabel: { type: 'string' },
              trialEndsAt: { type: 'string', nullable: true },
              cancelAtPeriodEnd: { type: 'boolean' },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      requireAuth(request);

      const sub = await getSubscription(fastify.prisma, tenantId);
      if (!sub) {
        const tenant = await fastify.prisma.tenant.findUnique({
          where: { id: tenantId, deletedAt: null },
          select: { trialEndsAt: true },
        });
        return reply.status(200).send({
          status: null,
          currentPeriodEnd: null,
          planId: null,
          planLabel: 'Plano mensal',
          trialEndsAt: tenant?.trialEndsAt?.toISOString() ?? null,
          cancelAtPeriodEnd: false,
        });
      }
      return reply.status(200).send(sub);
    }
  );

  // List last 10 invoices (admin)
  fastify.get(
    '/v1/billing/invoices',
    {
      schema: {
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                date: { type: 'string' },
                amount: { type: 'number' },
                currency: { type: 'string' },
                status: { type: 'string' },
                pdfUrl: { type: 'string', nullable: true },
                hostedInvoiceUrl: { type: 'string', nullable: true },
              },
            },
          },
          503: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      requireRole(user.role, 'admin');

      const result = await getInvoices(fastify.prisma, tenantId);
      if ('error' in result && result.error !== 'Billing is not configured') {
        return reply.status(503).send({ error: result.error });
      }
      const list = Array.isArray(result) ? result : [];
      return reply.status(200).send(list);
    }
  );

  // Change plan (admin)
  fastify.post(
    '/v1/billing/change-plan',
    {
      schema: {
        body: {
          type: 'object',
          required: ['planId'],
          properties: { planId: { type: 'string', enum: ['monthly', 'semiannual', 'annual'] } },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              currentPeriodEnd: { type: 'string' },
              planLabel: { type: 'string' },
            },
          },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          503: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      requireRole(user.role, 'admin');

      const body = request.body as { planId: string };
      const planId = body.planId as 'monthly' | 'semiannual' | 'annual';
      if (!['monthly', 'semiannual', 'annual'].includes(planId)) {
        return reply.status(400).send({ error: 'planId must be monthly, semiannual, or annual' });
      }

      const result = await changePlan(fastify.prisma, tenantId, planId);
      if ('error' in result) {
        const status = result.error.includes('No active') ? 400 : 503;
        return reply.status(status).send({ error: result.error });
      }
      await auditLog(fastify.prisma, tenantId, 'billing_plan_change', 'tenant', tenantId, user.userId, {
        planId,
      });
      return reply.status(200).send(result);
    }
  );

  // Cancel at period end (admin)
  fastify.post(
    '/v1/billing/cancel',
    {
      schema: {
        response: {
          200: { type: 'object', properties: { cancelAt: { type: 'string' } } },
          400: { type: 'object', properties: { error: { type: 'string' } } },
          503: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      requireRole(user.role, 'admin');

      const result = await cancelSubscription(fastify.prisma, tenantId);
      if ('error' in result) {
        const status = result.error.includes('No active') ? 400 : 503;
        return reply.status(status).send({ error: result.error });
      }
      await auditLog(fastify.prisma, tenantId, 'billing_cancel', 'tenant', tenantId, user.userId);
      return reply.status(200).send(result);
    }
  );

  // Reactivate subscription (admin)
  fastify.post(
    '/v1/billing/reactivate',
    {
      schema: {
        response: {
          200: { type: 'object', properties: { status: { type: 'string' } } },
          503: { type: 'object', properties: { error: { type: 'string' } } },
        },
      },
    },
    async (request, reply) => {
      const tenantId = requireTenant(request);
      const user = requireAuth(request);
      requireRole(user.role, 'admin');

      const result = await reactivateSubscription(fastify.prisma, tenantId);
      if ('error' in result) {
        return reply.status(503).send({ error: result.error });
      }
      await auditLog(fastify.prisma, tenantId, 'billing_reactivate', 'tenant', tenantId, user.userId);
      return reply.status(200).send(result);
    }
  );

  // Webhook: Stripe sends events here (no auth; verified by signature)
  fastify.post(
    '/v1/billing/webhook',
    { schema: { hide: true } },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const signature = request.headers['stripe-signature'] as string | undefined;
      if (!signature) {
        throw new BadRequestError('Missing stripe-signature header');
      }

      const rawBody = request.rawBody;
      if (!rawBody) {
        throw new BadRequestError('Raw body required for webhook');
      }

      const event = constructWebhookEvent(rawBody, signature);
      if (!event) {
        throw new BadRequestError('Invalid webhook signature');
      }

      switch (event.type) {
        case 'customer.subscription.updated':
          await handleSubscriptionUpdated(fastify.prisma, event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await handleSubscriptionDeleted(fastify.prisma, event.data.object as Stripe.Subscription);
          break;
        case 'invoice.paid':
          await handleInvoicePaid(fastify.prisma, event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await handleInvoicePaymentFailed(fastify.prisma, event.data.object as Stripe.Invoice);
          break;
        default:
          // ignore other events
          break;
      }

      return reply.status(200).send({ received: true });
    }
  );
}
