import { NextRequest, NextResponse } from 'next/server';
import { isValidIndianPhone, verifyOtp } from '@/lib/auth/otp';
import { createSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { dispatch } from '@/lib/events/bus';
import { transitionUser } from '@/lib/state-machine/user';

export async function POST(req: NextRequest) {
  try {
    const { phone, code, locale } = await req.json();
    if (typeof phone !== 'string' || !isValidIndianPhone(phone)) {
      return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
    }
    if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
      return NextResponse.json({ ok: false, error: 'invalid_code' }, { status: 400 });
    }
    const ok = (await verifyOtp(phone, code)).ok;
    if (!ok) return NextResponse.json({ ok: false, error: 'wrong_code' }, { status: 401 });

    let user;
    try {
      user = await prisma.user.upsert({
        where: { phone },
        update: { locale: typeof locale === 'string' ? locale : undefined },
        create: {
          phone,
          locale: typeof locale === 'string' ? locale : 'en',
          lifecycleState: 'NEW',
          preferences: { create: {} },
        },
      });
    } catch (dbErr) {
      console.error('[otp/verify] DB upsert failed:', {
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
