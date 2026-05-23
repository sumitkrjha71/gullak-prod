// POST /api/auth/otp/debug-send — diagnostic endpoint for MSG91 troubleshooting.
//
// Returns the full MSG91 response body so you can see exactly why an SMS
// isn't being delivered (DLT mismatch, template not approved, low balance,
// invalid sender ID, etc.).
//
// Locked behind:
//   1. Header `x-debug-key` matching DEBUG_OTP_KEY env var (set this in Vercel
//      to any long random string; only people who know the value can use it)
//   2. Returns 404 if the env var is not set, so the endpoint effectively
//      disappears once you remove DEBUG_OTP_KEY from Vercel after debugging.
//
// USAGE (from your terminal, with DEBUG_OTP_KEY=mysecret on Vercel):
//   curl -X POST https://gullak-prod.vercel.app/api/auth/otp/debug-send \
//        -H 'content-type: application/json' \
//        -H 'x-debug-key: mysecret' \
//        -d '{"phone":"9876543210"}'

import { NextRequest, NextResponse } from 'next/server';
import { isValidIndianPhone } from '@/lib/auth/otp';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const expectedKey = process.env.DEBUG_OTP_KEY;
  if (!expectedKey) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }
  const providedKey = req.headers.get('x-debug-key');
  if (providedKey !== expectedKey) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  const body = await req.json().catch(() => ({}));
  const phone = String(body?.phone ?? '');
  if (!isValidIndianPhone(phone)) {
    return NextResponse.json({ error: 'invalid_phone' }, { status: 400 });
  }

  const authKey    = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_TEMPLATE_ID;
  if (!authKey || !templateId) {
    return NextResponse.json({
      error: 'msg91_env_missing',
      hasAuthKey:    Boolean(authKey),
      hasTemplateId: Boolean(templateId),
    }, { status: 500 });
  }

  // Fixed test code (NOT stored in DB — this is a probe only).
  const testCode = '987654';

  const requestBody = {
    template_id: templateId,
    mobile:      `91${phone}`,
    otp:         testCode,
    otp_length:  6,
  };

  let httpStatus = 0;
  let rawText    = '';
  try {
    const res = await fetch('https://control.msg91.com/api/v5/otp', {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'authkey':      authKey,
      },
      body: JSON.stringify(requestBody),
    });
    httpStatus = res.status;
    rawText    = await res.text();
  } catch (err) {
    return NextResponse.json({
      stage:  'network',
      error:  (err as Error)?.message ?? 'unknown',
    }, { status: 500 });
  }

  let parsed: unknown = null;
  try { parsed = JSON.parse(rawText); } catch { /* not JSON */ }

  logger.warn(
    { provider: 'msg91', httpStatus, rawText: rawText.slice(0, 200) },
    'msg91_debug_probe',
  );

  return NextResponse.json({
    stage:           'received',
    httpStatus,
    requestBodySent: {
      template_id: templateId.slice(0, 8) + '…',
      mobile:      `91${phone}`,
      otp_length:  6,
    },
    msg91Response:   parsed ?? rawText,
    interpretation:  interpretMsg91(httpStatus, parsed as { type?: string; message?: string } | null),
  });
}

function interpretMsg91(
  status: number,
  body: { type?: string; message?: string } | null,
): string {
  if (status === 401) return 'AUTH KEY rejected. Re-check MSG91_AUTH_KEY env var on Vercel — must be the v5 API key, not the legacy v2 key.';
  if (status === 400) return 'MSG91 rejected the payload. Likely a malformed mobile number or wrong template_id format.';
  if (status === 0)   return 'Network error — MSG91 unreachable from Vercel runtime.';
  if (body?.type === 'success') return 'MSG91 accepted the request. If SMS still not received: check DLT registration, template approval status, or your MSG91 account balance.';
  if (body?.type === 'error')   return `MSG91 returned an error: ${body.message ?? 'no message'}. Common causes: DLT template not approved, sender ID not whitelisted, balance exhausted, variable count mismatch.`;
  return `Unexpected response shape. HTTP ${status}, body type=${body?.type ?? 'unknown'}.`;
}
