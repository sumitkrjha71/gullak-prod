import { NextRequest, NextResponse } from 'next/server';
import { isValidIndianPhone, verifyOtp } from '@/lib/auth/otp';
import { createSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { withDbRetry } from '@/lib/db/retry';
import { dispatch } from '@/lib/events/bus';
import { transitionUser } from '@/lib/state-machine/user';
import { findReferrerByCode, recordReferralAndReward } from '@/lib/referrals/codes';

// Allow up to 30s so Neon cold-start retries (1.5+3+4.5s) have headroom.
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  try {
    const { phone, code, locale, referralCode } = await req.json();
    if (typeof phone !== 'string' || !isValidIndianPhone(phone)) {
      return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
    }
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: 'invalid_code' }, { status: 400 });
    }
    const ok = (await verifyOtp(phone, code)).ok;
    if (!ok) return NextResponse.json({ ok: false, error: 'wrong_code' }, { status: 401 });

    // V5 M9 — resolve referral code BEFORE upsert so we know if user is new.
    let referrer: { id: string; code: string } | null = null;
    if (typeof referralCode === 'string' && referralCode.trim().length > 0) {
      try {
        referrer = await findReferrerByCode(referralCode.trim());
      } catch {
        // bad code — silently ignore, signup still proceeds
      }
    }

    let existingUser;
    try {
      existingUser = await withDbRetry(
        () => prisma.user.findUnique({ where: { phone } }),
        'otp/verify:findUser',
      );
    } catch (dbErr) {
      console.error('[otp/verify] DB findUnique failed after retries:', {
        message: (dbErr as Error)?.message,
        name: (dbErr as Error)?.name,
        code: (dbErr as { code?: string })?.code,
      });
      return NextResponse.json(
        {
          ok: false,
          error: 'db_waking',
          hint: 'Database is waking up — please try again in 5 seconds',
        },
        { status: 503 },
      );
    }
    const wasNewUser = !existingUser;

    let user;
    try {
      user = await withDbRetry(
        () => prisma.user.upsert({
          where: { phone },
          update: { locale: typeof locale === 'string' ? locale : undefined },
          create: {
            phone,
            locale: typeof locale === 'string' ? locale : 'en',
            lifecycleState: 'NEW',
            preferences: { create: {} },
            referredBy: referrer?.id ?? null,
          },
        }),
        'otp/verify:upsertUser',
      );
    } catch (dbErr) {
      console.error('[otp/verify] DB upsert failed after retries:', {
        message: (dbErr as Error)?.message,
        name: (dbErr as Error)?.name,
        code: (dbErr as { code?: string })?.code,
        databaseUrlLen: (process.env.DATABASE_URL ?? '').length,
        nodeVersion: process.version,
      });
      return NextResponse.json(
        {
          ok: false,
          error: 'db_unavailable',
          hint: 'Database connection failed — check DATABASE_URL on Vercel and run migrations',
        },
        { status: 503 },
      );
    }

    // Best-effort lifecycle transition + event dispatch — never block login on these.
    if (user.lifecycleState === 'NEW') {
      try {
        await transitionUser(user.id, 'ONBOARDING');
        await dispatch({
          userId: user.id,
          type: 'USER_CREATED',
          payload: { phone, locale: user.locale },
        });
      } catch (sideErr) {
        console.warn('[otp/verify] post-login side effects failed (non-fatal):', sideErr);
      }
    }

    // V5 M9 — if this was a new user with a valid referral code, record + reward.
    if (wasNewUser && referrer && referrer.id !== user.id) {
      try {
        await recordReferralAndReward({
          referrerUserId: referrer.id,
          refereeUserId: user.id,
          refereePhone: phone,
          code: referrer.code,
        });
      } catch (refErr) {
        console.warn('[otp/verify] referral recording failed (non-fatal):', refErr);
      }
    }

    try {
      await createSession({ userId: user.id, phone });
    } catch (sessErr) {
      console.error('[otp/verify] session creation failed:', sessErr);
      return NextResponse.json(
        { ok: false, error: 'session_failed', hint: 'AUTH_SECRET env var may be missing' },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[otp/verify] uncaught error:', {
      message: (err as Error)?.message,
      stack: (err as Error)?.stack?.split('\n').slice(0, 5).join('\n'),
    });
    return NextResponse.json(
      { ok: false, error: 'internal', hint: 'Check Vercel runtime logs' },
      { status: 500 },
    );
  }
}
