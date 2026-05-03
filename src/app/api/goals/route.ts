import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { dispatch } from '@/lib/events/bus';
import { transitionUser } from '@/lib/state-machine/user';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { type, title, targetPaise, deadline } = await req.json();
  if (!type || !title || typeof targetPaise !== 'number' || targetPaise <= 0) {
    return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });
  }

  const isFirst = (await prisma.goal.count({ where: { userId: session.userId } })) === 0;
  const goal = await prisma.goal.create({
    data: {
      userId: session.userId,
      type,
      title,
      targetPaise: BigInt(Math.round(targetPaise)),
      deadline: deadline ? new Date(deadline) : null,
      isPrimary: isFirst,
    },
  });
  await dispatch({
    userId: session.userId,
    type: 'GOAL_CREATED',
    payload: { goalId: goal.id, type: goal.type, targetPaise: Number(goal.targetPaise) },
  });
  // Forward state if appropriate.
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (user && (user.lifecycleState === 'TRUST_ACKNOWLEDGED' || user.lifecycleState === 'ONBOARDING')) {
    try {
      await transitionUser(session.userId, 'GOAL_CREATED');
    } catch {
      // ignore — illegal transitions are tolerated for returning users
    }
  }
  return NextResponse.json({ ok: true, id: goal.id });
}
