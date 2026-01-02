/**
 * Database Schema using Drizzle ORM
 * PostgreSQL schema for RepurposeFlow
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  index,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'pro', 'business']);
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active',
  'canceled',
  'past_due',
  'trialing',
  'incomplete',
  'incomplete_expired',
  'unpaid',
  'paused',
]);
export const generationStatusEnum = pgEnum('generation_status', [
  'pending',
  'completed',
  'failed',
  'partial',
]);
export const toneEnum = pgEnum('tone', ['educational', 'conversational', 'opinionated', 'authority']);

// Users table
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clerkUserId: varchar('clerk_user_id', { length: 255 }).unique().notNull(),
    email: varchar('email', { length: 255 }).unique().notNull(),
    fullName: varchar('full_name', { length: 255 }),

    // Subscription
    subscriptionTier: subscriptionTierEnum('subscription_tier').notNull().default('free'),
    subscriptionStatus: subscriptionStatusEnum('subscription_status').notNull().default('active'),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).unique(),
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
    subscriptionCurrentPeriodEnd: timestamp('subscription_current_period_end', { withTimezone: true }),

    // Usage tracking
    generationsCountCurrentMonth: integer('generations_count_current_month').notNull().default(0),
    generationsLimit: integer('generations_limit').notNull().default(10),
    lastGenerationAt: timestamp('last_generation_at', { withTimezone: true }),
    usageResetAt: timestamp('usage_reset_at', { withTimezone: true }).notNull().defaultNow(),

    // Preferences
    defaultTone: toneEnum('default_tone').default('conversational'),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => ({
    clerkUserIdIdx: index('idx_users_clerk_user_id').on(table.clerkUserId),
    stripeCustomerIdIdx: index('idx_users_stripe_customer_id').on(table.stripeCustomerId),
    subscriptionTierIdx: index('idx_users_subscription_tier').on(table.subscriptionTier),
    createdAtIdx: index('idx_users_created_at').on(table.createdAt),
  })
);

// Generations table
export const generations = pgTable(
  'generations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Input
    inputContent: text('input_content').notNull(),
    inputContentHash: varchar('input_content_hash', { length: 64 }).notNull(),
    selectedPlatforms: text('selected_platforms').array().notNull(),
    selectedTone: toneEnum('selected_tone').notNull(),

    // Analysis output
    coreMessage: text('core_message'),
    keyPoints: jsonb('key_points'),
    detectedTopic: varchar('detected_topic', { length: 255 }),
    detectedAudience: varchar('detected_audience', { length: 255 }),

    // Platform outputs
    outputTiktok: jsonb('output_tiktok'),
    outputTwitter: jsonb('output_twitter'),
    outputThreads: jsonb('output_threads'),
    outputLinkedin: jsonb('output_linkedin'),
    outputInstagram: jsonb('output_instagram'),
    outputEmail: jsonb('output_email'),
    outputFacebook: jsonb('output_facebook'),

    // Metadata
    generationTimeMs: integer('generation_time_ms'),
    llmProvider: varchar('llm_provider', { length: 50 }),
    llmModel: varchar('llm_model', { length: 100 }),
    totalTokensUsed: integer('total_tokens_used'),

    // Status
    status: generationStatusEnum('status').notNull().default('pending'),
    errorMessage: text('error_message'),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index('idx_generations_user_id').on(table.userId),
    createdAtIdx: index('idx_generations_created_at').on(table.createdAt),
    statusIdx: index('idx_generations_status').on(table.status),
    inputHashIdx: index('idx_generations_input_hash').on(table.inputContentHash),
    userCreatedIdx: index('idx_generations_user_created').on(table.userId, table.createdAt),
  })
);

// Usage logs table
export const usageLogs = pgTable(
  'usage_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    generationId: uuid('generation_id').references(() => generations.id, { onDelete: 'set null' }),

    // Event tracking
    eventType: varchar('event_type', { length: 50 }).notNull(),
    platformCount: integer('platform_count').notNull(),
    platforms: text('platforms').array(),

    // Cost tracking
    tokensUsed: integer('tokens_used'),
    estimatedCostUsd: integer('estimated_cost_usd'), // Store in cents

    // Metadata
    userAgent: text('user_agent'),
    ipAddress: varchar('ip_address', { length: 45 }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_usage_logs_user_id').on(table.userId),
    createdAtIdx: index('idx_usage_logs_created_at').on(table.createdAt),
    eventTypeIdx: index('idx_usage_logs_event_type').on(table.eventType),
  })
);

// Subscriptions table
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),

    // Stripe data
    stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }).unique().notNull(),
    stripeCustomerId: varchar('stripe_customer_id', { length: 255 }).notNull(),
    stripePriceId: varchar('stripe_price_id', { length: 255 }).notNull(),

    // Subscription details
    tier: subscriptionTierEnum('tier').notNull(),
    status: subscriptionStatusEnum('status').notNull(),

    // Billing cycle
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
    cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),

    // Pricing
    amountCents: integer('amount_cents').notNull(),
    currency: varchar('currency', { length: 3 }).notNull().default('usd'),
    interval: varchar('interval', { length: 20 }).notNull(),

    // Trial
    trialStart: timestamp('trial_start', { withTimezone: true }),
    trialEnd: timestamp('trial_end', { withTimezone: true }),

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdIdx: index('idx_subscriptions_user_id').on(table.userId),
    stripeSubscriptionIdIdx: index('idx_subscriptions_stripe_subscription_id').on(table.stripeSubscriptionId),
    statusIdx: index('idx_subscriptions_status').on(table.status),
  })
);

// Webhook events table
export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Source
    source: varchar('source', { length: 50 }).notNull(),
    eventType: varchar('event_type', { length: 255 }).notNull(),
    eventId: varchar('event_id', { length: 255 }).unique().notNull(),

    // Payload
    payload: jsonb('payload').notNull(),

    // Processing
    processed: boolean('processed').notNull().default(false),
    processedAt: timestamp('processed_at', { withTimezone: true }),
    errorMessage: text('error_message'),
    retryCount: integer('retry_count').notNull().default(0),

    // Metadata
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    sourceIdx: index('idx_webhook_events_source').on(table.source),
    eventIdIdx: index('idx_webhook_events_event_id').on(table.eventId),
    processedIdx: index('idx_webhook_events_processed').on(table.processed),
    createdAtIdx: index('idx_webhook_events_created_at').on(table.createdAt),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  generations: many(generations),
  usageLogs: many(usageLogs),
  subscriptions: many(subscriptions),
}));

export const generationsRelations = relations(generations, ({ one, many }) => ({
  user: one(users, {
    fields: [generations.userId],
    references: [users.id],
  }),
  usageLogs: many(usageLogs),
}));

export const usageLogsRelations = relations(usageLogs, ({ one }) => ({
  user: one(users, {
    fields: [usageLogs.userId],
    references: [users.id],
  }),
  generation: one(generations, {
    fields: [usageLogs.generationId],
    references: [generations.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

// Types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Generation = typeof generations.$inferSelect;
export type NewGeneration = typeof generations.$inferInsert;
export type UsageLog = typeof usageLogs.$inferSelect;
export type NewUsageLog = typeof usageLogs.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
