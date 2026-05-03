// Mocked OTP. Drop-in replacement surface for Twilio Verify post-V1.
//
// Production-defensive: handles every shape the env var might arrive as
// (undefined, empty, whitespace-padded, surrounding quotes from Vercel).
// And ALWAYS accepts '123456' as a universal investor-demo fallback regardless
// of any env override — guarantees demos work even if Vercel env is misconfigured.

function normaliseEnvCode(raw: string | undefined): string {
  if (!raw) return '';
  // Strip surrounding double or single quotes (Vercel users sometimes wrap values),
  // then trim whitespace and any stray non-digits. Keep digits only.
  const stripped = raw.trim().replace(/^['"]|['"]$/g, '').trim();
  return stripped.replace(/\D/g, '');
}

const ENV_CODE = normaliseEnvCode(process.env.OTP_DEMO_CODE);
const PRIMARY_CODE = /^\d{6}$/.test(ENV_CODE) ? ENV_CODE : '123456';
const UNIVERSAL_DEMO_FALLBACK = '123456';

export async function sendOtp(_phone: string): Promise<{ ok: true }> {
  // No-op in V1. In prod we'd call Twilio Verify here.
  return { ok: true };
}

export async function verifyOtp(_phone: string, code: string): Promise<{ ok: boolean }> {
  const cleaned = (code ?? '').replace(/\D/g, '');
  const matches = cleaned === PRIMARY_CODE || cleaned === UNIVERSAL_DEMO_FALLBACK;
  // Single line of server log — appears in Vercel runtime logs.
  // Helps diagnose why a code didn't match without leaking the actual digits.
  if (!matches) {
    console.warn(
      `[otp] mismatch: got len=${cleaned.length} primary_len=${PRIMARY_CODE.length} env_was=${ENV_CODE.length}`,
    );
  }
  return { ok: matches };
}

export function isValidIndianPhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}
