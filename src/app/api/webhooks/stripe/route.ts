/**
 * POST /api/webhooks/stripe
 * Handle Stripe webhook events for subscription management
 */

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

import { headers } from 'next/headers';
import Stripe from 'stripe';
import { db, users, subscriptions, webhookEvents } from '@/db';
import { eq } from 'drizzle-orm';
import { updateUserTier } from '@/lib/usage';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = headers().get('stripe-signature')!;

    let event: Stripe.Event;

    // Verify webhook signature
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('[Stripe Webhook] Signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Log webhook event (for debugging and idempotency)
    await db.insert(webhookEvents).values({
      source: 'stripe',
      eventType: event.type,
      eventId: event.id,
      payload: event as any,
      processed: false,
    });

    // Process event
    console.log('[Stripe Webhook] Processing event:', event.type);

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    // Mark webhook as processed
    await db
      .update(webhookEvents)
      .set({ processed: true, processedAt: new Date() })
      .where(eq(webhookEvents.eventId, event.id));

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Stripe Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Get user by Stripe customer ID
  const user = await db.query.users.findFirst({
    where: eq(users.stripeCustomerId, customerId),
  });

  if (!user) {
    console.error('[Stripe] User not found for customer:', customerId);
    return;
  }

  // Fetch subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Determine tier from price ID
  const priceId = subscription.items.data[0].price.id;
  const tier = getTierFromPriceId(priceId);

  // Create subscription record
  await db.insert(subscriptions).values({
    userId: user.id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    stripePriceId: priceId,
    tier,
    status: subscription.status,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    amountCents: subscription.items.data[0].price.unit_amount || 0,
    currency: subscription.currency,
    interval: subscription.items.data[0].price.recurring?.interval || 'month',
  });

  // Update user
  await db
    .update(users)
    .set({
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    })
    .where(eq(users.id, user.id));

  // Update tier and limits
  await updateUserTier(user.id, tier);

  console.log('[Stripe] Checkout completed for user:', user.id, 'tier:', tier);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await db.query.users.findFirst({
    where: eq(users.stripeCustomerId, customerId),
  });

  if (!user) {
    console.error('[Stripe] User not found for customer:', customerId);
    return;
  }

  const priceId = subscription.items.data[0].price.id;
  const tier = getTierFromPriceId(priceId);

  // Update subscription record
  await db
    .update(subscriptions)
    .set({
      status: subscription.status,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

  // Update user
  await db
    .update(users)
    .set({
      subscriptionStatus: subscription.status,
      subscriptionCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
    })
    .where(eq(users.id, user.id));

  // Update tier if changed
  await updateUserTier(user.id, tier);

  console.log('[Stripe] Subscription updated for user:', user.id, 'status:', subscription.status);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  const user = await db.query.users.findFirst({
    where: eq(users.stripeCustomerId, customerId),
  });

  if (!user) {
    console.error('[Stripe] User not found for customer:', customerId);
    return;
  }

  // Update subscription record
  await db
    .update(subscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));

  // Downgrade user to free tier
  await updateUserTier(user.id, 'free');

  await db
    .update(users)
    .set({
      subscriptionStatus: 'canceled',
      stripeSubscriptionId: null,
    })
    .where(eq(users.id, user.id));

  console.log('[Stripe] Subscription deleted for user:', user.id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const user = await db.query.users.findFirst({
    where: eq(users.stripeCustomerId, customerId),
  });

  if (!user) {
    console.error('[Stripe] User not found for customer:', customerId);
    return;
  }

  // Update subscription status
  await db
    .update(users)
    .set({
      subscriptionStatus: 'past_due',
    })
    .where(eq(users.id, user.id));

  console.log('[Stripe] Payment failed for user:', user.id);
}

function getTierFromPriceId(priceId: string): 'free' | 'pro' | 'business' {
  if (priceId === process.env.STRIPE_PRICE_ID_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_ID_BUSINESS) return 'business';
  return 'free';
}
