// V5 M2 — POST /api/autopilot/burst — user-triggered one-shot save (bonus lock).

import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { fireBurst } from '@/lib/rules/inflow';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauth' }, { status: 401 });

  const { amountPaise, goalId, note } = await req.json().catch(() => ({}));
  if (typeof amountPaise !== 'number' || amountPaise < 100 || amountPaise > 10_00_000_00) {
    // 1 rupee minimum, 10 lakh maximum
    return NextResponse.json(
      { ok: false, error: 'bad_amount', hint: 'Amount ₹1 se ₹10 lakh ke beech mein hona chahiye.' },
      { status: 400 },
    );
  }

  try {
    const result = await fireBurst({
      userId: session.userId,
      amountPaise: Math.round(amountPaise),
      goalId: typeof goalId === 'string' ? goalId : undefined,
      note: typeof note === 'string' ? note : undefined,
    });
    return NextResponse.json({ ok: true, result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    if (msg === 'no_active_goal') {
      return NextResponse.json(
        { ok: false, error: 'no_goal', hint: 'Pehle ek goal banayein, phir burst-save karein.' },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: false, error: 'failed', hint: msg }, { status: 500 });
  }
}
