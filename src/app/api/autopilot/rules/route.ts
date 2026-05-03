import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { dispatch } from '@/lib/events/bus';
import { transitionUser } from '@/lib/state-machine/user';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json();
  const { goalId, mode, amountPaise, frequency, roundUpTo } = body;

  if (!goalId || !['fixed', 'roundup', 'sweep'].includes(mode)) {
    return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });
  }
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== session.userId) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const rule = await prisma.autopilotRule.create({
    data: {
      userId: session.userId,
      goalId,
      mode,
      amountPaise: typeof amountPaise === 'number' && amountPaise > 0 ? BigInt(Math.round(amountPaise)) : null,
      frequency: mode === 'fixed' ? (frequency ?? 'daily') : null,
      roundUpTo: mode === 'roundup' ? (roundUpTo ?? 10) : null,
    },
  });
  await dispatch({
    userId: session.userId,
    type: 'AUTOPILOT_SET',
    payload: { ruleId: rule.id, mode, amountPaise: amountPaise ?? undefined },
  });
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (user && user.lifecycleState === 'GOAL_CREATED') {
    try {
      await transitionUser(session.userId, 'AUTOPILOT_CONFIGURED');
    } catch {}
  }
  return NextResponse.json({ ok: true, id: rule.id });
}
