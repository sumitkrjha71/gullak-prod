import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { linkConsent } from '@/lib/aa';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { fipId } = await req.json();
  if (typeof fipId !== 'string') return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });
  try {
    const r = await linkConsent({ userId: session.userId, fipId });
    return NextResponse.json({ ok: true, consentHandle: r.consentHandle });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'failed' }, { status: 400 });
  }
}
