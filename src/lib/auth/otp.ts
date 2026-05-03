// Mocked OTP. Any phone, code = OTP_DEMO_CODE (default "123456").
// Drop-in replacement surface for Twilio Verify post-V1.

// Defensive: treats undefined, null, AND empty string as "not configured" → fall back to 123456.
// Also always accepts the universal demo code '123456' as a safety net for investor demos,
// even when an admin sets a different OTP_DEMO_CODE.
const ENV_CODE = (process.env.OTP_DEMO_CODE ?? '').trim();
const PRIMARY_CODE = ENV_CODE.length > 0 ? ENV_CODE : '123456';
const UNIVERSAL_DEMO_FALLBACK = '123456';

export async function sendOtp(_phone: string): Promise<{ ok: true }> {
  // No-op in V1. In prod we'd call Twilio Verify here.
  return { ok: true };
}

export async function verifyOtp(_phone: string, code: string): Promise<{ ok: boolean }> {
  return { ok: code === PRIMARY_CODE || code === UNIVERSAL_DEMO_FALLBACK };
}

export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}
