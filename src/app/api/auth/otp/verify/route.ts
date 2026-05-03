import { NextRequest, NextResponse } from 'next/server';
import { isValidIndianPhone, verifyOtp } from '@/lib/auth/otp';
import { createSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { dispatch } from '@/lib/events/bus';
import { transitionUser } from '@/lib/state-machine/user';

export async function POST(req: NextRequest) {
  const { phone, code, locale } = await req.json();
  if (typeof phone !== 'string' || !isValidIndianPhone(phone)) {
    return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
  }
  if (typeof code !== 'string' || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ ok: false, error: 'invalid_code' }, { status: 400 });
  }
  const ok = (await verifyOtp(phone, code)).ok;
  if (!ok) return NextResponse.json({ ok: false, error: 'wrong_code' }, { status: 401 });

  const user = await prisma.user.upsert({
    where: { phone },
    update: { locale: typeof locale === 'string' ? locale : undefined },
    create: {
      phone,
      locale: typeof locale === 'string' ? locale : 'en',
      lifecycleState: 'NEW',
      preferences: { create: {} },
    },
  });

  // Transition to ONBOARDING (if first time).
  if (user.lifecycleState === 'NEW') {
    await transitionUser(user.id, 'ONBOARDING');
    await dispatch({
      userId: user.id,
      type: 'USER_CREATED',
      payload: { phone, locale: user.locale },
    });
  }

  await createSession({ userId: user.id, phone });

  return NextResponse.json({ ok: true });
}
