import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { ruleId } = await req.json();
  const rule = await prisma.autopilotRule.findUnique({ where: { id: ruleId } });
  if (!rule || rule.userId !== session.userId) return NextResponse.json({ ok: false }, { status: 404 });
  await prisma.autopilotRule.update({ where: { id: ruleId }, data: { status: 'active', pauseUntil: null } });
  await writeAudit({ userId: session.userId, eventType: 'RULE_RESUMED', payload: { ruleId }, source: 'user' });
  return NextResponse.json({ ok: true });
}
