// V2 demo-mode OTP verify.
// Universal demo OTP `123456` works for any valid Indian phone — no DB calls.
// All sessions point to the seeded demo user (DEMO_USER_ID), so the demo
// always works regardless of Neon cold-start or build/seed state.

import { NextRequest, NextResponse } from 'next/server';
import { isValidIndianPhone } from '@/lib/auth/otp';
import { createSession } from '@/lib/auth/session';
import { DEMO_USER_ID, DEMO_OTP } from '@/lib/auth/demo';

export const maxDuration = 10;

export async function POST(req: NextRequest) {
  try {
    const { phone, code } = await req.json();
    if (typeof phone !== 'string' || !isValidIndianPhone(phone)) {
      return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
    }
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: 'invalid_code' }, { status: 400 });
    }
    // Strip any stray non-digits and compare both as string and numerically.
    const cleaned = code.replace(/\D/g, '');
    const matches = cleaned === DEMO_OTP || Number(cleaned) === Number(DEMO_OTP);
    if (!matches) {
      return NextResponse.json({ ok: false, error: 'wrong_code' }, { status: 401 });
    }

    // Demo mode: every login points to the same seeded demo user.
    // No DB calls, no event dispatch, no upsert — pure session token.
    await createSession({ userId: DEMO_USER_ID, phone });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[otp/verify] uncaught:', (err as Error)?.message);
    return NextResponse.json({ ok: false, error: 'wrong_code' }, { status: 401 });
  }
}
