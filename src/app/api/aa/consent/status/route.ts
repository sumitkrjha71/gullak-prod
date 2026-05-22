import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { getActiveConsent, SUPPORTED_FIPS } from '@/lib/aa/consent';

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const consent = await getActiveConsent(session.userId);
  if (!consent) {
    return NextResponse.json({ ok: true, linked: false, fips: SUPPORTED_FIPS });
  }

  return NextResponse.json({
    ok: true,
    linked: true,
    consentHandle: consent.consentHandle,
    status: consent.status,
    fipId: consent.fipId,
    expiresAt: consent.expiresAt,
    fetchedAt: consent.fetchedAt,
    fips: SUPPORTED_FIPS,
  });
}
