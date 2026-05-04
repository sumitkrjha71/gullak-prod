// V5 M1 — GET list members of a shared goal. Used by the family view.
// Returns anonymized first-name + initial for non-self members for privacy.

import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: goalId } = await params;
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauth' }, { status: 401 });

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });

  // Caller must be a member to view.
  const isOwner = goal.userId === session.userId;
  const isMember = isOwner
    ? true
    : !!(await prisma.goalMember.findUnique({
        where: { goalId_userId: { goalId, userId: session.userId } },
      }));
  if (!isMember) {
    return NextResponse.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }

  const members = await prisma.goalMember.findMany({
    where: { goalId },
    include: { user: true },
    orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
  });

  // If the goal isn't shared yet but the caller is the owner, return solo-owner view.
  if (members.length === 0 && isOwner) {
    return NextResponse.json({
      ok: true,
      goalTitle: goal.title,
      goalTargetPaise: Number(goal.targetPaise),
      goalSavedPaise: Number(goal.savedPaise),
      isShared: goal.isShared,
      members: [
        {
          userId: session.userId,
          role: 'owner',
          displayName: 'You',
          contributedPaise: Number(goal.savedPaise),
          joinedAt: goal.createdAt.toISOString(),
        },
      ],
    });
  }

  return NextResponse.json({
    ok: true,
    goalTitle: goal.title,
    goalTargetPaise: Number(goal.targetPaise),
    goalSavedPaise: Number(goal.savedPaise),
    isShared: goal.isShared,
    members: members.map((m) => ({
      userId: m.userId,
      role: m.role,
      displayName:
        m.userId === session.userId
          ? 'You'
          : displayName(m.user.name, m.user.phone),
      contributedPaise: Number(m.contributedPaise),
      joinedAt: m.joinedAt.toISOString(),
    })),
  });
}

function displayName(name: string | null, phone: string): string {
  if (name && name.trim().length > 0) {
    const first = name.trim().split(/\s+/)[0];
    return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
  }
  return `+91 ${phone.slice(0, 2)}***${phone.slice(-2)}`;
}
