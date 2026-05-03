import { NextRequest, NextResponse } from 'next/server';
import { sendOtp, isValidIndianPhone } from '@/lib/auth/otp';

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (typeof phone !== 'string' || !isValidIndianPhone(phone)) {
    return NextResponse.json({ ok: false, error: 'invalid_phone' }, { status: 400 });
  }
  await sendOtp(phone);
  return NextResponse.json({ ok: true });
}
