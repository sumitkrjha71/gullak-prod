import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { id } = await params;
  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== session.userId) return NextResponse.json({ ok: false }, { status: 404 });

  await prisma.$transaction([
    prisma.goal.update({ where: { id }, data: { status: 'completed' } }),
    prisma.autopilotRule.updateMany({ where: { goalId: id }, data: { status: 'stopped' } }),
  ]);
  await writeAudit({
    userId: session.userId,
    eventType: 'GOAL_STOPPED',
    payload: { goalId: id },
    source: 'user',
  });
  return NextResponse.json({ ok: true });
}
