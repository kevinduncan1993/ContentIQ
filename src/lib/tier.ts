/**
 * Tier and Trial Management
 */

import { db, users } from '@/db';
import { eq } from 'drizzle-orm';

export type Platform = 'tiktok' | 'twitter' | 'linkedin' | 'instagram' | 'threads' | 'email' | 'facebook';

/**
 * Platform access by tier
 * Free tier: Only Threads and LinkedIn (with 3-day trial)
 * Pro tier: All platforms
 */
const TIER_PLATFORMS: Record<'free' | 'pro' | 'business', Platform[]> = {
  free: ['threads', 'linkedin'],
  pro: ['tiktok', 'twitter', 'linkedin', 'instagram', 'threads', 'email', 'facebook'],
  business: ['tiktok', 'twitter', 'linkedin', 'instagram', 'threads', 'email', 'facebook'],
};

/**
 * Trial duration in days
 */
const TRIAL_DURATION_DAYS = 3;

/**
 * Check if user's free trial is still active
 */
export function isTrialActive(userCreatedAt: Date): boolean {
  const now = new Date();
  const trialEndDate = new Date(userCreatedAt);
  trialEndDate.setDate(trialEndDate.getDate() + TRIAL_DURATION_DAYS);

  return now < trialEndDate;
}

/**
 * Get trial end date
 */
export function getTrialEndDate(userCreatedAt: Date): Date {
  const trialEnd = new Date(userCreatedAt);
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DURATION_DAYS);
  return trialEnd;
}

/**
 * Get days remaining in trial
 */
export function getTrialDaysRemaining(userCreatedAt: Date): number {
  const now = new Date();
  const trialEnd = getTrialEndDate(userCreatedAt);
  const msRemaining = trialEnd.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

  return Math.max(0, daysRemaining);
}

/**
 * Get hours remaining in trial
 */
export function getTrialHoursRemaining(userCreatedAt: Date): number {
  const now = new Date();
  const trialEnd = getTrialEndDate(userCreatedAt);
  const msRemaining = trialEnd.getTime() - now.getTime();
  const hoursRemaining = Math.ceil(msRemaining / (1000 * 60 * 60));

  return Math.max(0, hoursRemaining);
}

/**
 * Check if user can access a platform
 */
export function canAccessPlatform(
  platform: Platform,
  tier: 'free' | 'pro' | 'business',
  userCreatedAt: Date
): { allowed: boolean; reason?: string } {
  // Pro and Business tiers have full access
  if (tier === 'pro' || tier === 'business') {
    return { allowed: true };
  }

  // Free tier - check trial status
  const trialActive = isTrialActive(userCreatedAt);
  const allowedPlatforms = TIER_PLATFORMS[tier];

  // If trial is active, allow all platforms
  if (trialActive) {
    return { allowed: true };
  }

  // Trial expired - only allow free tier platforms
  if (allowedPlatforms.includes(platform)) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: `${platform} is only available on the Pro plan. Upgrade to access all platforms.`,
  };
}

/**
 * Get platforms available for a tier
 */
export function getAvailablePlatforms(
  tier: 'free' | 'pro' | 'business',
  userCreatedAt: Date
): Platform[] {
  // Pro and Business tiers have full access
  if (tier === 'pro' || tier === 'business') {
    return TIER_PLATFORMS[tier];
  }

  // Free tier - check trial status
  const trialActive = isTrialActive(userCreatedAt);

  // If trial is active, allow all platforms
  if (trialActive) {
    return TIER_PLATFORMS.pro; // All platforms during trial
  }

  // Trial expired - only free tier platforms
  return TIER_PLATFORMS.free;
}

/**
 * Get locked platforms for a tier
 */
export function getLockedPlatforms(
  tier: 'free' | 'pro' | 'business',
  userCreatedAt: Date
): Platform[] {
  if (tier === 'pro' || tier === 'business') {
    return [];
  }

  const trialActive = isTrialActive(userCreatedAt);
  if (trialActive) {
    return [];
  }

  const allPlatforms: Platform[] = ['tiktok', 'twitter', 'linkedin', 'instagram', 'threads', 'email', 'facebook'];
  const allowedPlatforms = TIER_PLATFORMS.free;

  return allPlatforms.filter((p) => !allowedPlatforms.includes(p));
}

/**
 * Validate platform access for multiple platforms
 */
export function validatePlatformAccess(
  platforms: Platform[],
  tier: 'free' | 'pro' | 'business',
  userCreatedAt: Date
): { valid: boolean; invalidPlatforms: Platform[]; message?: string } {
  const invalidPlatforms: Platform[] = [];

  for (const platform of platforms) {
    const access = canAccessPlatform(platform, tier, userCreatedAt);
    if (!access.allowed) {
      invalidPlatforms.push(platform);
    }
  }

  if (invalidPlatforms.length > 0) {
    return {
      valid: false,
      invalidPlatforms,
      message: `Your plan doesn't include access to: ${invalidPlatforms.join(', ')}. Upgrade to Pro to unlock all platforms.`,
    };
  }

  return { valid: true, invalidPlatforms: [] };
}

/**
 * Get user's tier status with trial information
 */
export async function getUserTierStatus(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: {
      subscriptionTier: true,
      createdAt: true,
      subscriptionStatus: true,
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const tier = user.subscriptionTier;
  const createdAt = user.createdAt;
  const isFree = tier === 'free';
  const trialActive = isFree && isTrialActive(createdAt);
  const trialExpired = isFree && !trialActive;

  return {
    tier,
    isFree,
    trialActive,
    trialExpired,
    trialDaysRemaining: isFree ? getTrialDaysRemaining(createdAt) : 0,
    trialHoursRemaining: isFree ? getTrialHoursRemaining(createdAt) : 0,
    trialEndDate: isFree ? getTrialEndDate(createdAt) : null,
    availablePlatforms: getAvailablePlatforms(tier, createdAt),
    lockedPlatforms: getLockedPlatforms(tier, createdAt),
  };
}
