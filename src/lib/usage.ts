/**
 * Usage Tracking and Quota Management
 */

import { db, users } from '@/db';
import { eq, sql } from 'drizzle-orm';

/**
 * Check if user can generate content (quota check)
 */
export async function checkUserQuota(userId: string): Promise<{
  canGenerate: boolean;
  remaining: number;
  limit: number;
  resetsAt: Date;
}> {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      generationsCountCurrentMonth: true,
      generationsLimit: true,
      usageResetAt: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if we need to reset usage
  const now = new Date();
  if (user.usageResetAt && new Date(user.usageResetAt) < now) {
    // Reset usage for new month
    await db
      .update(users)
      .set({
        generationsCountCurrentMonth: 0,
        usageResetAt: getNextResetDate(),
      })
      .where(eq(users.id, userId));

    return {
      canGenerate: true,
      remaining: user.generationsLimit,
      limit: user.generationsLimit,
      resetsAt: getNextResetDate(),
    };
  }

  const canGenerate = user.generationsCountCurrentMonth < user.generationsLimit;
  const remaining = Math.max(0, user.generationsLimit - user.generationsCountCurrentMonth);

  return {
    canGenerate,
    remaining,
    limit: user.generationsLimit,
    resetsAt: user.usageResetAt || getNextResetDate(),
  };
}

/**
 * Increment user's generation count
 */
export async function incrementUsage(userId: string, platformCount: number = 1): Promise<void> {
  await db
    .update(users)
    .set({
      generationsCountCurrentMonth: sql`${users.generationsCountCurrentMonth} + 1`,
      lastGenerationAt: new Date(),
    })
    .where(eq(users.id, userId));
}

/**
 * Get usage limits based on subscription tier
 */
export function getUsageLimitForTier(tier: 'free' | 'pro' | 'business'): number {
  const limits = {
    free: 10,
    pro: 500,
    business: 999999, // Effectively unlimited
  };

  return limits[tier];
}

/**
 * Update user's tier and limits (called when subscription changes)
 */
export async function updateUserTier(
  userId: string,
  tier: 'free' | 'pro' | 'business'
): Promise<void> {
  const newLimit = getUsageLimitForTier(tier);

  await db
    .update(users)
    .set({
      subscriptionTier: tier,
      generationsLimit: newLimit,
    })
    .where(eq(users.id, userId));
}

/**
 * Get next monthly reset date (1st of next month)
 */
function getNextResetDate(): Date {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth;
}

/**
 * Get user's current usage stats
 */
export async function getUserUsageStats(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      generationsCountCurrentMonth: true,
      generationsLimit: true,
      lastGenerationAt: true,
      usageResetAt: true,
      subscriptionTier: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const remaining = Math.max(0, user.generationsLimit - user.generationsCountCurrentMonth);
  const percentageUsed = (user.generationsCountCurrentMonth / user.generationsLimit) * 100;

  return {
    used: user.generationsCountCurrentMonth,
    limit: user.generationsLimit,
    remaining,
    percentageUsed: Math.round(percentageUsed),
    tier: user.subscriptionTier,
    lastUsedAt: user.lastGenerationAt,
    resetsAt: user.usageResetAt,
  };
}
