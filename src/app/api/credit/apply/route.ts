import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { applyForLoan, disburse } from '@/lib/ocen';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { offerId } = await req.json();
  if (typeof offerId !== 'string') return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });

  try {
    const r = await applyForLoan({ userId: session.userId, offerId, formPayload: {} });
    // V3 demo: auto-disburse immediately so the demo flow shows end-to-end.
    if (!r.isReplay) {
      await disburse(r.applicationId);
    }
    return NextResponse.json({ ok: true, applicationId: r.applicationId, isReplay: r.isReplay });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'failed';
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
