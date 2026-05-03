import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (typeof body.notifySalary === 'boolean') data.notifySalary = body.notifySalary;
  if (typeof body.notifyRoundup === 'boolean') data.notifyRoundup = body.notifyRoundup;
  if (typeof body.notifyWeekly === 'boolean') data.notifyWeekly = body.notifyWeekly;
  if (typeof body.forceFailNext === 'boolean') data.forceFailNext = body.forceFailNext;

  await prisma.userPreference.upsert({
    where: { userId: session.userId },
    update: data,
    create: { userId: session.userId, ...(data as object) },
  });
  await writeAudit({
    userId: session.userId,
    eventType: 'PREF_CHANGED',
    payload: data,
    source: 'user',
  });
  return NextResponse.json({ ok: true });
}
