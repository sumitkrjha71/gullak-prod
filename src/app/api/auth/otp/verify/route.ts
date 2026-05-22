import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp, isValidIndianPhone } from '@/lib/auth/otp';
import { createSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { DEMO_USER_ID, DEMO_PHONE, DEMO_OTP } from '@/lib/auth/demo';

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, code } = body ?? {};

    if (typeof phone !== 'string' || !isValidIndianPhone(phone)) {
      return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
    }
    if (typeof code !== 'string' || !/^\d{6}$/.test(code.replace(/\D/g, ''))) {
      return NextResponse.json({ ok: false, error: 'invalid_code' }, { status: 400 });
    }

    // ── Demo phone fast-path ─────────────────────────────────────────────────
    // The seeded demo user bypasses OTPChallenge so demos work even when the
    // DB schema migration is pending or Neon is cold-starting.
    if (phone === DEMO_PHONE && code.replace(/\D/g, '') === DEMO_OTP) {
      await createSession({ userId: DEMO_USER_ID, phone });
      return NextResponse.json({ ok: true });
    }

    // ── Real OTP verification ─────────────────────────────────────────────────
    const result = await verifyOtp(phone, code);
    if (!result.ok) {
      const status = result.reason === 'max_attempts_exceeded' ? 429 : 401;
      return NextResponse.json({ ok: false, error: result.reason }, { status });
    }

    // Find or create the user record for this phone.
    let user = await prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone, lifecycleState: 'NEW' },
      });
      logger.info({ route: 'otp/verify' }, 'user_created');
    }

    await createSession({ userId: user.id, phone });
    logger.info({ route: 'otp/verify', userId: user.id }, 'session_created');
    return NextResponse.json({ ok: true });

  } catch (err) {
    logger.error({ route: 'otp/verify', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
