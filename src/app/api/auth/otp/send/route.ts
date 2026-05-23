import { NextRequest, NextResponse } from 'next/server';
import { sendOtp, isValidIndianPhone } from '@/lib/auth/otp';
import { ratelimit } from '@/lib/ratelimit';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = body ?? {};

    if (typeof phone !== 'string' || !isValidIndianPhone(phone)) {
      return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
    }

    const rl = await ratelimit.otp(phone);
    if (!rl.allowed) {
      logger.warn({ route: 'otp/send' }, 'rate_limit_exceeded');
      return NextResponse.json({ ok: false, error: 'too_many_requests' }, { status: 429 });
    }

    await sendOtp(phone);
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Provider failure (MSG91 down, template rejected, etc.) needs to be
    // surfaced so the user knows to retry. Phone enumeration isn't a concern
    // here — the failure is about the SMS pipeline, not about whether the
    // phone is registered (registration happens at verify, not send).
    const msg = (err as Error)?.message ?? 'unknown';
    logger.error({ route: 'otp/send', err: msg }, 'otp_send_failed');
    return NextResponse.json(
      { ok: false, error: 'provider_failure' },
      { status: 502 },
    );
  }
}
