import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { initiateConsent, getActiveConsent } from '@/lib/aa/consent';

/** Renew = revoke old + initiate new consent for the same FIP. */
export async function POST(_req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const existing = await getActiveConsent(session.userId);
  const fipId = existing?.fipId ?? 'MOCK_HDFC';

  try {
    const result = await initiateConsent(session.userId, [fipId]);
    return NextResponse.json({ ok: true, ...result });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'failed' }, { status: 500 });
  }
}
