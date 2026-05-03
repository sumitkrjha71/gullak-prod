import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { ruleId, kind } = await req.json();
  const rule = await prisma.autopilotRule.findUnique({
    where: { id: ruleId },
    include: { user: true },
  });
  if (!rule || rule.userId !== session.userId) return NextResponse.json({ ok: false }, { status: 404 });

  let until: Date | null = null;
  if (kind === 'seven') until = new Date(Date.now() + 7 * 86400000);
  else if (kind === 'salary' && rule.user.salaryDay) {
    const now = new Date();
    const next = new Date(now);
    if (now.getDate() >= rule.user.salaryDay) next.setMonth(now.getMonth() + 1);
    next.setDate(rule.user.salaryDay);
    until = next;
  }
  await prisma.autopilotRule.update({
    where: { id: ruleId },
    data: { status: 'paused', pauseUntil: until },
  });
  await writeAudit({
    userId: session.userId,
    eventType: 'RULE_PAUSED',
    payload: { ruleId, kind, until: until?.toISOString() ?? null },
    source: 'user',
  });
  return NextResponse.json({ ok: true });
}
