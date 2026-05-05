// V5 M2 — POST /api/sim/inflow — simulate an incoming UPI credit / salary
// to test inflow_pct rules. Used by Settings dev simulator + demo flow.

import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { fireInflowRules } from '@/lib/rules/inflow';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauth' }, { status: 401 });

  const { inflowPaise, label } = await req.json().catch(() => ({}));
  if (typeof inflowPaise !== 'number' || inflowPaise < 100) {
    return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });
  }

  const inflowEventId = `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const r = await fireInflowRules({
    userId: session.userId,
    inflowPaise: Math.round(inflowPaise),
    inflowEventId,
  });

  return NextResponse.json({
    ok: true,
    inflowEventId,
    label: typeof label === 'string' ? label : null,
    fired: r.fired,
    rules: r.results.map((x) => ({ ruleId: x.ruleId, status: x.result.status, refId: x.result.refId })),
  });
}
