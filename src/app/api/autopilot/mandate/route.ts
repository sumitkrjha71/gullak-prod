import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';
import { transitionUser } from '@/lib/state-machine/user';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { ruleId } = await req.json();
  const rule = await prisma.autopilotRule.findUnique({ where: { id: ruleId } });
  if (!rule || rule.userId !== session.userId) return NextResponse.json({ ok: false }, { status: 404 });

  // Simulated mandate: 98% authorise, 2% fail (non-blocking demo).
  const ok = Math.random() < 0.98;
  if (!ok) return NextResponse.json({ ok: false, error: 'mandate_failed' }, { status: 502 });

  // Cap = max(amountPaise * 5, ₹2000) so daily debits comfortably pass.
  const cap = rule.amountPaise && rule.amountPaise > 0n ? rule.amountPaise * 5n : 200000n;
  await prisma.mandate.upsert({
    where: { ruleId: rule.id },
    update: { maxPerDebitPaise: cap, revokedAt: null, authorisedAt: new Date() },
    create: {
      userId: session.userId,
      ruleId: rule.id,
      maxPerDebitPaise: cap,
      cap: rule.mode === 'sweep' ? 'monthly' : 'daily',
    },
  });
  await writeAudit({
    userId: session.userId,
    eventType: 'MANDATE_AUTHORISED',
    payload: { ruleId, capPaise: Number(cap) },
    source: 'user',
  });
  // Forward state to ACTIVE.
  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (user && (user.lifecycleState === 'AUTOPILOT_CONFIGURED' || user.lifecycleState === 'MANDATE_PENDING')) {
    try {
      if (user.lifecycleState === 'AUTOPILOT_CONFIGURED') await transitionUser(session.userId, 'MANDATE_PENDING');
      await transitionUser(session.userId, 'ACTIVE');
    } catch {}
  }
  return NextResponse.json({ ok: true });
}
