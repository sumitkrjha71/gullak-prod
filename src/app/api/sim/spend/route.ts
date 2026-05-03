import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { recordSpend } from '@/lib/rules/roundup';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { amountRupees } = await req.json();
  if (typeof amountRupees !== 'number' || amountRupees <= 0) {
    return NextResponse.json({ ok: false, error: 'bad_amount' }, { status: 400 });
  }
  const r = await recordSpend(session.userId, Math.round(amountRupees * 100));
  return NextResponse.json({ ok: true, savePaise: r.savePaise });
}
