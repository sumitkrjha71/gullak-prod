// Mocked OTP. Any phone, code = OTP_DEMO_CODE (default "123456").
// Drop-in replacement surface for Twilio Verify post-V1.

const DEMO_CODE = process.env.OTP_DEMO_CODE ?? '123456';

export async function sendOtp(_phone: string): Promise<{ ok: true }> {
  // No-op in V1. In prod we'd call Twilio Verify here.
  return { ok: true };
}

export async function verifyOtp(_phone: string, code: string): Promise<{ ok: boolean }> {
  return { ok: code === DEMO_CODE };
}

export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}
