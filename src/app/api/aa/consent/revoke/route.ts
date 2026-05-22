import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { revokeConsent } from '@/lib/aa/consent';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { consentHandle } = await req.json();
  if (typeof consentHandle !== 'string') {
    return NextResponse.json({ ok: false, error: 'consentHandle_required' }, { status: 400 });
  }

  try {
    await revokeConsent(session.userId, consentHandle);
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'failed';
    const status = msg === 'consent_not_found' ? 404 : 500;
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
}
