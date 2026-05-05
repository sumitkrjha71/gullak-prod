// Autopilot rule creation. Accepts a client-provided `id` so the client can
// navigate immediately. Single DB write — dispatch + transitionUser side-effects
// removed from the request path so we don't stack 3-5 sequential cold-start
// retries and exceed Vercel's 10s function timeout.

import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await req.json();
  const { id, goalId, mode, amountPaise, frequency, roundUpTo, inflowPct } = body;

  if (!goalId || !['fixed', 'roundup', 'sweep', 'inflow_pct'].includes(mode)) {
    return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });
  }

  // Validate inflow_pct: 1-50% (basis points 100-5000).
  let inflowBps: number | null = null;
  if (mode === 'inflow_pct') {
    if (typeof inflowPct !== 'number' || inflowPct < 100 || inflowPct > 5000) {
      return NextResponse.json(
        { ok: false, error: 'bad_inflow_pct', hint: 'Percentage 1% se 50% ke beech mein' },
        { status: 400 },
      );
    }
    inflowBps = Math.round(inflowPct);
  }

  try {
    const rule = await prisma.autopilotRule.create({
      data: {
        ...(typeof id === 'string' && id.length > 0 ? { id } : {}),
        userId: session.userId,
        goalId,
        mode,
        amountPaise:
          typeof amountPaise === 'number' && amountPaise > 0 && mode !== 'inflow_pct'
            ? BigInt(Math.round(amountPaise))
            : null,
        frequency: mode === 'fixed' ? (frequency ?? 'daily') : null,
        roundUpTo: mode === 'roundup' ? (roundUpTo ?? 10) : null,
        inflowPct: inflowBps,
      },
    });
    return NextResponse.json({ ok: true, id: rule.id });
  } catch (err) {
    console.error('[api/autopilot/rules] create failed:', (err as Error)?.message);
    return NextResponse.json({ ok: false, error: 'create_failed' }, { status: 500 });
  }
}
