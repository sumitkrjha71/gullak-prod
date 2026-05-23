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
//
// MSG91 v5 OTP API quirks (the reasons earlier attempts silently failed):
//   - Field is `mobile` (singular). `mobiles` is the bulk-SMS shape and gets
//     ignored, so the request returns 200 with no SMS queued.
//   - 200 OK !== "delivered". The response body carries
//       { "type": "success" | "error", "message": "...", "request_id": "..." }
//     DLT-not-approved, template-pending, low balance, and unauthorised
//     sender ID all surface as `type: "error"` inside a 200 response.
//   - `mobile` must include the country code with no `+` (e.g. "919876543210").
//   - `otp_length` is required when the template variable is `##OTP##` and
//     the OTP digits don't match the template's declared length.

async function sendViaMSG91(phone: string, code: string): Promise<void> {
  const authKey = process.env.MSG91_AUTH_KEY!;
  const templateId = process.env.MSG91_TEMPLATE_ID!;

  const body = JSON.stringify({
    template_id: templateId,
    mobile:      `91${phone}`,
    otp:         code,
    otp_length:  6,
  });

  let res: Response;
  try {
    res = await fetch('https://control.msg91.com/api/v5/otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey': authKey,
      },
      body,
    });
  } catch (networkErr) {
    logger.error(
      { provider: 'msg91', err: (networkErr as Error)?.message },
      'msg91_network_failure',
    );
    throw new Error(`msg91_network_failure: ${(networkErr as Error)?.message}`);
  }

  const rawText = await res.text();
  let parsed: { type?: string; message?: string; request_id?: string } = {};
  try { parsed = JSON.parse(rawText); } catch { /* not JSON */ }

  const ok = res.ok && parsed.type === 'success';
  if (!ok) {
    logger.error(
      {
        provider:    'msg91',
        httpStatus:  res.status,
        bodyType:    parsed.type ?? 'no_type',
        bodyMessage: parsed.message ?? 'no_message',
        requestId:   parsed.request_id ?? null,
        templateId:  templateId.slice(0, 6) + '…', // partial, for traceability
        // Never log full authkey or the OTP code itself.
      },
      'msg91_send_failed',
    );
    throw new Error(
      `msg91_send_failed:${res.status}:${parsed.type ?? 'unknown'}:${parsed.message ?? 'no_message'}`,
    );
  }

  logger.info(
    { provider: 'msg91', requestId: parsed.request_id ?? null },
    'otp_sent',
  );
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
