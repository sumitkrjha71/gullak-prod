// Rate limiting via Upstash Redis.
// Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in env to enable.
// Without those vars, all checks pass (safe for local dev).

import { Ratelimit } from '@upstash/ratelimit';
import { Redis }     from '@upstash/redis';

function buildLimiter(requests: number, window: `${number} ${'s'|'m'|'h'}`) {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  return new Ratelimit({
    redis:     new Redis({ url, token }),
    limiter:   Ratelimit.slidingWindow(requests, window),
    analytics: false,
  });
}

// 3 OTP sends per phone per 10 minutes
const otpLimiter   = buildLimiter(3, '10 m');
// 5 burst payments per user per hour
const burstLimiter = buildLimiter(5, '1 h');
// 10 KYC verifications per user per day
const kycLimiter   = buildLimiter(10, '24 h');

export type RateLimitResult = { allowed: boolean; remaining: number; reset: number };

async function check(
  limiter: ReturnType<typeof buildLimiter>,
  key: string,
): Promise<RateLimitResult> {
  if (!limiter) return { allowed: true, remaining: 999, reset: 0 };
  const { success, remaining, reset } = await limiter.limit(key);
  return { allowed: success, remaining, reset };
}

export const ratelimit = {
  otp:   (phone: string)  => check(otpLimiter,   `otp:${phone}`),
  burst: (userId: string) => check(burstLimiter,  `burst:${userId}`),
  kyc:   (userId: string) => check(kycLimiter,    `kyc:${userId}`),
};
