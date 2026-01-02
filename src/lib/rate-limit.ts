/**
 * Rate Limiting using Upstash Redis
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

/**
 * Per-user rate limit: 10 requests per minute
 */
export const userRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  prefix: 'ratelimit:user',
  analytics: true,
});

/**
 * Per-IP rate limit: 20 requests per minute
 */
export const ipRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  prefix: 'ratelimit:ip',
  analytics: true,
});

/**
 * Global rate limit: 1000 requests per minute
 */
export const globalRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 m'),
  prefix: 'ratelimit:global',
  analytics: true,
});

/**
 * Check if user can make a request
 */
export async function checkRateLimit(userId: string, ip: string): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // Check user rate limit
  const userResult = await userRateLimit.limit(userId);
  if (!userResult.success) {
    return {
      allowed: false,
      limit: userResult.limit,
      remaining: userResult.remaining,
      reset: userResult.reset,
    };
  }

  // Check IP rate limit
  const ipResult = await ipRateLimit.limit(ip);
  if (!ipResult.success) {
    return {
      allowed: false,
      limit: ipResult.limit,
      remaining: ipResult.remaining,
      reset: ipResult.reset,
    };
  }

  // Check global rate limit
  const globalResult = await globalRateLimit.limit('global');
  if (!globalResult.success) {
    return {
      allowed: false,
      limit: globalResult.limit,
      remaining: globalResult.remaining,
      reset: globalResult.reset,
    };
  }

  return {
    allowed: true,
    limit: userResult.limit,
    remaining: userResult.remaining,
    reset: userResult.reset,
  };
}
