// PAN verification module.
//
// Production (SETU_API_KEY set): calls Setu's PAN Verify API (~₹2/call).
// Development / demo: returns a deterministic mock based on the PAN prefix.
//
// The seam: set SETU_API_KEY + SETU_CLIENT_ID in Vercel env to go live.
// Zero code change required.

import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

const SETU_BASE = 'https://dg.setu.co';
const SETU_PRODUCT_INSTANCE_ID = process.env.SETU_PRODUCT_INSTANCE_ID ?? '';
const SETU_API_KEY = process.env.SETU_API_KEY ?? '';

export type PANVerifyResult =
  | { ok: true;  name: string; maskedPan: string; providerRef: string }
  | { ok: false; reason: 'invalid_pan' | 'pan_not_found' | 'provider_error' | 'already_verified' };

function maskPan(pan: string): string {
  // ABCDE1234F → ABCDE****F
  return pan.slice(0, 5) + '****' + pan.slice(-1);
}

function isValidPanFormat(pan: string): boolean {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.toUpperCase());
}

// ── Mock response for dev / staging ──────────────────────────────────────────

function mockVerify(pan: string): PANVerifyResult {
  const upper = pan.toUpperCase();
  // Simulate a failed PAN for testing
  if (upper.startsWith('XXXXX')) {
    return { ok: false, reason: 'pan_not_found' };
  }
  // Derive a deterministic mock name from the PAN
  const initial = upper[0];
  const mockNames: Record<string, string> = {
    A: 'Aarav Sharma', B: 'Bharat Singh', C: 'Chandan Verma',
    D: 'Deepak Gupta', E: 'Esha Patel',  F: 'Farhan Khan',
    G: 'Geeta Rani',   H: 'Harish Kumar', I: 'Indira Nair',
    J: 'Jitendra Yadav', K: 'Kavita Mishra', L: 'Lakshmi Devi',
    M: 'Mahesh Tiwari', N: 'Neha Agarwal', O: 'Om Prakash',
    P: 'Priya Iyer',   Q: 'Qamar Ali',    R: 'Rajesh Rao',
    S: 'Sunita Joshi', T: 'Tarun Mehta',  U: 'Usha Pandey',
    V: 'Vijay Reddy',  W: 'Wasim Akram',  X: 'Xerxes Mistry',
    Y: 'Yashpal Garg', Z: 'Zara Sheikh',
  };
  return {
    ok: true,
    name: mockNames[initial] ?? 'Demo User',
    maskedPan: maskPan(upper),
    providerRef: `MOCK-PAN-${Date.now()}`,
  };
}

// ── Setu PAN Verify API ───────────────────────────────────────────────────────

async function setuVerifyPan(pan: string): Promise<PANVerifyResult> {
  const res = await fetch(`${SETU_BASE}/api/v2/digilocker/pan/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-product-instance-id': SETU_PRODUCT_INSTANCE_ID,
      'x-api-key': SETU_API_KEY,
    },
    body: JSON.stringify({ pan: pan.toUpperCase() }),
  });

  const json = await res.json() as Record<string, unknown>;

  if (!res.ok) {
    logger.warn({ provider: 'setu', status: res.status, pan: '[REDACTED]' }, 'pan_verify_provider_error');
    return { ok: false, reason: 'provider_error' };
  }

  const data = json.data as Record<string, unknown> | undefined;
  if (!data || json.status === 'ERROR') {
    return { ok: false, reason: 'pan_not_found' };
  }

  const name = (data.name ?? data.fullName ?? '') as string;
  return {
    ok: true,
    name: String(name).trim(),
    maskedPan: maskPan(pan.toUpperCase()),
    providerRef: String(json.traceId ?? json.id ?? ''),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function verifyPAN(userId: string, pan: string): Promise<PANVerifyResult> {
  const upper = pan.trim().toUpperCase();

  if (!isValidPanFormat(upper)) {
    return { ok: false, reason: 'invalid_pan' };
  }

  // Idempotency: if already verified, don't re-bill the provider.
  const existing = await prisma.kYCRecord.findFirst({
    where: { userId, type: 'PAN', status: 'VERIFIED' },
  });
  if (existing) {
    return { ok: false, reason: 'already_verified' };
  }

  const isReal = Boolean(SETU_API_KEY);
  const result = isReal ? await setuVerifyPan(upper) : mockVerify(upper);

  // Write KYCRecord regardless of outcome — full audit trail.
  await prisma.kYCRecord.create({
    data: {
      userId,
      type: 'PAN',
      status: result.ok ? 'VERIFIED' : 'FAILED',
      provider: isReal ? 'setu' : 'mock',
      providerRef: result.ok ? result.providerRef : null,
      maskedIdentifier: result.ok ? result.maskedPan : maskPan(upper),
    },
  });

  if (result.ok) {
    // Stamp panLast4 on the user record for display.
    await prisma.user.update({
      where: { id: userId },
      data: { panLast4: upper.slice(-4) },
    });
    logger.info({ userId, provider: isReal ? 'setu' : 'mock' }, 'pan_verified');
  } else {
    logger.warn({ userId, reason: result.reason }, 'pan_verify_failed');
  }

  return result;
}
