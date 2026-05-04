// V5 M1 — POST /api/goals/join — current user joins a shared Family Gullak via invite code.
// Login REQUIRED (per user's Q5: "Real account needed").
// Idempotent: re-joining returns the existing membership.

import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { dispatch } from '@/lib/events/bus';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: 'unauth', hint: 'Pehle login karein, phir join karein.' },
      { status: 401 },
    );
  }

  const { code } = await req.json().catch(() => ({}));
  if (typeof code !== 'string' || code.length < 6) {
    return NextResponse.json({ ok: false, error: 'bad_code' }, { status: 400 });
  }

  const normalizedCode = code.trim().toUpperCase();
  const goal = await prisma.goal.findUnique({ where: { inviteCode: normalizedCode } });
  if (!goal || !goal.isShared) {
    return NextResponse.json(
      { ok: false, error: 'invite_not_found', hint: 'Yeh invite ab valid nahi hai.' },
      { status: 404 },
    );
  }

  // Owner trying to "join" their own goal — return success silently with role=owner.
  if (goal.userId === session.userId) {
    return NextResponse.json({ ok: true, goalId: goal.id, role: 'owner', alreadyMember: true });
  }

  // Idempotent join.
  const existing = await prisma.goalMember.findUnique({
    where: { goalId_userId: { goalId: goal.id, userId: session.userId } },
  });
  if (existing) {
    return NextResponse.json({ ok: true, goalId: goal.id, role: existing.role, alreadyMember: true });
  }

  await prisma.goalMember.create({
    data: {
      goalId: goal.id,
      userId: session.userId,
      role: 'member',
      contributedPaise: BigInt(0),
    },
  });

  await dispatch({
    userId: session.userId,
    type: 'GOAL_JOINED',
    payload: { goalId: goal.id, code: normalizedCode },
  });

  return NextResponse.json({ ok: true, goalId: goal.id, role: 'member', alreadyMember: false });
}
