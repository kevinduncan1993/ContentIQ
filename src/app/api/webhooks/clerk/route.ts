/**
 * POST /api/webhooks/clerk
 * Handle Clerk webhook events for user management
 */

import { NextRequest, NextResponse } from 'next/server';
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { db, users, webhookEvents } from '@/db';
import { eq } from 'drizzle-orm';
import type { WebhookEvent } from '@clerk/nextjs/server';
import Stripe from 'stripe';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET!;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export async function POST(request: NextRequest) {
  try {
    // Get headers
    const headerPayload = headers();
    const svixId = headerPayload.get('svix-id');
    const svixTimestamp = headerPayload.get('svix-timestamp');
    const svixSignature = headerPayload.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
    }

    // Get body
    const payload = await request.json();
    const body = JSON.stringify(payload);

    // Verify webhook
    const wh = new Webhook(webhookSecret);
    let event: WebhookEvent;

    try {
      event = wh.verify(body, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      }) as WebhookEvent;
    } catch (err) {
      console.error('[Clerk Webhook] Verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Log webhook event
    await db.insert(webhookEvents).values({
      source: 'clerk',
      eventType: event.type,
      eventId: payload.data.id || `clerk-${Date.now()}`,
      payload: event as any,
      processed: false,
    });

    console.log('[Clerk Webhook] Processing event:', event.type);

    // Process event
    switch (event.type) {
      case 'user.created':
        await handleUserCreated(event);
        break;

      case 'user.updated':
        await handleUserUpdated(event);
        break;

      case 'user.deleted':
        await handleUserDeleted(event);
        break;

      default:
        console.log(`[Clerk Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Clerk Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleUserCreated(event: WebhookEvent) {
  if (event.type !== 'user.created') return;

  const { id, email_addresses, first_name, last_name } = event.data;

  const email = email_addresses?.[0]?.email_address;
  const fullName = [first_name, last_name].filter(Boolean).join(' ');

  if (!email) {
    console.error('[Clerk] No email found for user:', id);
    return;
  }

  // Create Stripe customer
  const stripeCustomer = await stripe.customers.create({
    email,
    name: fullName || undefined,
    metadata: {
      clerkUserId: id,
    },
  });

  // Create user in database
  await db.insert(users).values({
    clerkUserId: id,
    email,
    fullName: fullName || null,
    stripeCustomerId: stripeCustomer.id,
    subscriptionTier: 'free',
    generationsLimit: 10,
    usageResetAt: getNextMonthStart(),
  });

  console.log('[Clerk] User created:', id);
}

async function handleUserUpdated(event: WebhookEvent) {
  if (event.type !== 'user.updated') return;

  const { id, email_addresses, first_name, last_name } = event.data;

  const email = email_addresses?.[0]?.email_address;
  const fullName = [first_name, last_name].filter(Boolean).join(' ');

  if (!email) return;

  // Update user in database
  await db
    .update(users)
    .set({
      email,
      fullName: fullName || null,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkUserId, id));

  console.log('[Clerk] User updated:', id);
}

async function handleUserDeleted(event: WebhookEvent) {
  if (event.type !== 'user.deleted') return;

  const { id } = event.data;
  if (!id) return;

  // Soft delete user (keep data for compliance/billing)
  await db
    .update(users)
    .set({
      deletedAt: new Date(),
    })
    .where(eq(users.clerkUserId, id));

  console.log('[Clerk] User deleted:', id);
}

function getNextMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}
