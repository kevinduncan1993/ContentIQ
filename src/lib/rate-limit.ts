/**
 * Rate Limiting using Upstash Redis
 * OPTIONAL - Works without Redis (disables rate limiting)
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Check if Redis is configured
const hasRedis =
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis client only if configured
// Prevents "/pipeline" URL errors when env vars are missing
const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

/**
 * Per-user rate limit: 10 requests per minute
 * Only active if Redis is configured
 */
export const userRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'),
      prefix: 'ratelimit:user',
      analytics: true,
    })
  : null;

/**
 * Per-IP rate limit: 20 requests per minute
 * Only active if Redis is configured
 */
export const ipRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, '1 m'),
      prefix: 'ratelimit:ip',
      analytics: true,
    })
  : null;

/**
 * Global rate limit: 1000 requests per minute
 * Only active if Redis is configured
 */
export const globalRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1000, '1 m'),
      prefix: 'ratelimit:global',
      analytics: true,
    })
  : null;

/**
 * Check if user can make a request
 * Returns allowed=true if Redis is not configured (no rate limiting)
 */
export async function checkRateLimit(userId: string, ip: string): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  // If Redis is not configured, allow all requests
  if (!redis || !userRateLimit || !ipRateLimit || !globalRateLimit) {
    console.warn('[Rate Limit] Redis not configured - rate limiting disabled');
    return {
      allowed: true,
      limit: 999999,
      remaining: 999999,
      reset: Date.now() + 60000,
    };
  }

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
