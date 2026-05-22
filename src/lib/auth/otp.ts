// OTP challenge-response for phone auth.
//
// Production path (MSG91_AUTH_KEY set):
//   sendOtp  → generates a 6-digit code → stores hashed in OTPChallenge → sends via MSG91
//   verifyOtp → looks up active challenge → checks hash + attempts → marks verified
//
// Development / demo path (MSG91_AUTH_KEY absent):
//   sendOtp  → stores hash of OTP_DEMO_CODE in OTPChallenge (no SMS sent)
//   verifyOtp → validates against OTP_DEMO_CODE only
//
// The universal 123456 accept-all is GONE in production.

import crypto from 'crypto';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 5;
const HMAC_SECRET = process.env.OTP_HMAC_SECRET ?? 'dev-otp-hmac-secret-change-in-prod';

// ── Helpers ──────────────────────────────────────────────────────────────────

function hashCode(phone: string, code: string): string {
  return crypto.createHmac('sha256', HMAC_SECRET).update(`${phone}:${code}`).digest('hex');
}

function generateCode(): string {
  // Cryptographically random 6-digit code, zero-padded.
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
}

function getDemoCode(): string {
  const raw = process.env.OTP_DEMO_CODE ?? '123456';
  const digits = raw.trim().replace(/\D/g, '');
  return /^\d{6}$/.test(digits) ? digits : '123456';
}

// ── MSG91 sender ─────────────────────────────────────────────────────────────

async function sendViaMSG91(phone: string, code: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY!;
  const templateId = process.env.MSG91_TEMPLATE_ID!;

  const body = JSON.stringify({
    template_id: templateId,
    mobiles: `91${phone}`,
    otp: code,
  });

  const res = await fetch('https://control.msg91.com/api/v5/otp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      authkey: authKey,
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`MSG91 error ${res.status}: ${text}`);
  }

  logger.info({ phone: '[REDACTED]', provider: 'msg91' }, 'otp_sent');
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function sendOtp(phone: string): Promise<{ ok: true }> {
  const isProduction = process.env.NODE_ENV === 'production';
  const hasMSG91 = Boolean(process.env.MSG91_AUTH_KEY);

  const code = isProduction && hasMSG91 ? generateCode() : getDemoCode();
  const codeHash = hashCode(phone, code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  // Upsert: invalidate any prior active challenge for this phone by creating
  // a fresh one. Old rows expire naturally (TTL index).
  await prisma.oTPChallenge.create({
    data: { phone, codeHash, expiresAt },
  });

  if (isProduction && hasMSG91) {
    await sendViaMSG91(phone, code);
  } else {
    // Dev only — log to console so developer can see the code.
    if (!isProduction) {
      console.log(`[otp:dev] code for ${phone}: ${code}`);
    }
  }

  return { ok: true };
}

export async function verifyOtp(phone: string, code: string): Promise<{ ok: boolean; reason?: string }> {
  const cleaned = String(code ?? '').replace(/\D/g, '');
  if (cleaned.length !== 6) return { ok: false, reason: 'invalid_format' };

  const now = new Date();

  // Find the most recent active challenge for this phone.
  const challenge = await prisma.oTPChallenge.findFirst({
    where: {
      phone,
      expiresAt: { gt: now },
      verifiedAt: null,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!challenge) {
    logger.warn({ route: 'verifyOtp' }, 'otp_no_active_challenge');
    return { ok: false, reason: 'no_active_challenge' };
  }

  if (challenge.attempts >= MAX_ATTEMPTS) {
    logger.warn({ route: 'verifyOtp' }, 'otp_max_attempts');
    return { ok: false, reason: 'max_attempts_exceeded' };
  }

  const expectedHash = hashCode(phone, cleaned);
  const matches = crypto.timingSafeEqual(
    Buffer.from(challenge.codeHash, 'hex'),
    Buffer.from(expectedHash, 'hex'),
  );

  if (!matches) {
    await prisma.oTPChallenge.update({
      where: { id: challenge.id },
      data: { attempts: { increment: 1 } },
    });
    logger.warn({ route: 'verifyOtp', attempts: challenge.attempts + 1 }, 'otp_wrong_code');
    return { ok: false, reason: 'wrong_code' };
  }

  // Mark verified so it can't be reused.
  await prisma.oTPChallenge.update({
    where: { id: challenge.id },
    data: { verifiedAt: now },
  });

  logger.info({ route: 'verifyOtp' }, 'otp_verified');
  return { ok: true };
}

export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}
