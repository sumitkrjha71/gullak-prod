// V5 M1 — Group Gullak creation. Creates a shared goal in one call:
// - Goal with isShared=true, inviteCode, subType=theme.type
// - GoalMember row marking the creator as 'owner'
// Frontend then routes to /goals/[id]/family for member invites + share.

import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { generateInviteCode } from '@/lib/family/invite';
import { dispatch } from '@/lib/events/bus';

export const maxDuration = 15;

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauth' }, { status: 401 });

  const { type, title, targetPaise } = await req.json();
  if (!type || !title || typeof targetPaise !== 'number' || targetPaise <= 0) {
    return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });
  }

  // Generate a unique invite code (retry on the rare collision).
  let inviteCode = generateInviteCode();
  for (let attempt = 0; attempt < 3; attempt++) {
    const exists = await prisma.goal.findUnique({ where: { inviteCode } });
    if (!exists) break;
    inviteCode = generateInviteCode();
  }

  try {
    const isFirst = (await prisma.goal.count({ where: { userId: session.userId } })) === 0;
    const goal = await prisma.goal.create({
      data: {
        userId: session.userId,
        type: 'group',
        subType: type,
        title,
        targetPaise: BigInt(Math.round(targetPaise)),
        isPrimary: isFirst,
        isShared: true,
        inviteCode,
        members: {
          create: {
            userId: session.userId,
            role: 'owner',
          },
        },
      },
    });

    // Best-effort event — don't block on failure.
    try {
      await dispatch({
        userId: session.userId,
        type: 'GOAL_CREATED',
        payload: { goalId: goal.id, type: 'group', targetPaise: Number(goal.targetPaise) },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({ ok: true, goalId: goal.id, inviteCode });
  } catch (err) {
    console.error('[group-gullak] create failed:', (err as Error)?.message);
    return NextResponse.json({ ok: false, error: 'create_failed' }, { status: 500 });
  }
}
