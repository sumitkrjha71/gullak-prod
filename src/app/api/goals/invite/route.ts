// V5 M1 — POST /api/goals/invite — generates (or returns existing) invite code for a goal.
// Only the goal owner can invite. Marks the goal as shared on first invite.

import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { generateInviteCode } from '@/lib/family/invite';
import { dispatch } from '@/lib/events/bus';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauth' }, { status: 401 });

  const { goalId } = await req.json().catch(() => ({}));
  if (typeof goalId !== 'string' || !goalId) {
    return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return NextResponse.json({ ok: false, error: 'goal_not_found' }, { status: 404 });
  if (goal.userId !== session.userId) {
    return NextResponse.json({ ok: false, error: 'not_owner' }, { status: 403 });
  }

  // If already shared with a code, return it. Idempotent.
  if (goal.isShared && goal.inviteCode) {
    return NextResponse.json({ ok: true, code: goal.inviteCode, goalId });
  }

  // Generate a unique code with retry on collision.
  let code = '';
  for (let i = 0; i < 8; i++) {
    const candidate = generateInviteCode();
    const clash = await prisma.goal.findUnique({ where: { inviteCode: candidate } });
    if (!clash) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    return NextResponse.json({ ok: false, error: 'code_collision' }, { status: 500 });
  }

  // Mark shared, create owner GoalMember record (if missing).
  await prisma.$transaction([
    prisma.goal.update({
      where: { id: goalId },
      data: { isShared: true, inviteCode: code },
    }),
    prisma.goalMember.upsert({
      where: { goalId_userId: { goalId, userId: session.userId } },
      update: {},
      create: {
        goalId,
        userId: session.userId,
        role: 'owner',
        contributedPaise: goal.savedPaise,
      },
    }),
  ]);

  await dispatch({
    userId: session.userId,
    type: 'GOAL_SHARED',
    payload: { goalId, code },
  });

  return NextResponse.json({ ok: true, code, goalId });
}
