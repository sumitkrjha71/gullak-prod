// Rate limiting via Upstash Redis.
// Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in env to enable.
// In dev/preview missing config silently passes; in production it must be
// configured or every protected route fails closed.

import { Ratelimit } from '@upstash/ratelimit';
import { Redis }     from '@upstash/redis';
import { logger }    from '@/lib/logger';

const IS_PROD = process.env.NODE_ENV === 'production';

function buildLimiter(requests: number, window: `${number} ${'s'|'m'|'h'}`) {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (IS_PROD) {
      logger.error(
        { feature: 'ratelimit' },
        'upstash_missing_in_production — rate limiter will fail closed',
      );
    }
    return null;
  }

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
// 10 gold buy/sell transactions per user per day
const goldLimiter  = buildLimiter(10, '24 h');
// 10 MF buy/redeem transactions per user per day
const mfLimiter    = buildLimiter(10, '24 h');

export type RateLimitResult = { allowed: boolean; remaining: number; reset: number };

async function check(
  limiter: ReturnType<typeof buildLimiter>,
  key: string,
): Promise<RateLimitResult> {
  if (!limiter) {
    // Production with missing Upstash → fail closed. Dev/preview → pass.
    if (IS_PROD) {
      return { allowed: false, remaining: 0, reset: Date.now() + 60_000 };
    }
    return { allowed: true, remaining: 999, reset: 0 };
  }
  const { success, remaining, reset } = await limiter.limit(key);
  return { allowed: success, remaining, reset };
}

export const ratelimit = {
  otp:   (phone: string)  => check(otpLimiter,   `otp:${phone}`),
  burst: (userId: string) => check(burstLimiter,  `burst:${userId}`),
  kyc:   (userId: string) => check(kycLimiter,    `kyc:${userId}`),
  gold:  (userId: string) => check(goldLimiter,   `gold:${userId}`),
  mf:    (userId: string) => check(mfLimiter,     `mf:${userId}`),
};
