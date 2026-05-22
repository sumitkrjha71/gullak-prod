import { NextRequest, NextResponse } from 'next/server';
import { sendOtp, isValidIndianPhone } from '@/lib/auth/otp';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body ?? {};

    if (typeof phone !== 'string' || !isValidIndianPhone(phone)) {
      return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
    }

    await sendOtp(phone);

    // Always return ok:true — never reveal whether a phone is registered.
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error({ route: 'otp/send', err: (err as Error)?.message }, 'uncaught_error');
    // Return ok:true even on failure to prevent phone enumeration.
    return NextResponse.json({ ok: true });
  }
}
