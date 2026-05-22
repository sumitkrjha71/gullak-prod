import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';
import { isRazorpayEnabled, cancelSubscription } from '@/lib/payments/razorpay';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { ruleId } = await req.json();
  const rule = await prisma.autopilotRule.findUnique({
    where:   { id: ruleId },
    include: { mandate: true },
  });
  if (!rule || rule.userId !== session.userId) return NextResponse.json({ ok: false }, { status: 404 });

  await prisma.autopilotRule.update({ where: { id: ruleId }, data: { status: 'stopped' } });

  // Cancel the Razorpay subscription if one is active — prevents future debits.
  if (isRazorpayEnabled && rule.mandate?.pspSubscriptionId) {
    try {
      await cancelSubscription(rule.mandate.pspSubscriptionId);
      await prisma.mandate.update({
        where: { ruleId },
        data:  { status: 'REVOKED', revokedAt: new Date() },
      });
    } catch (err) {
      // Non-fatal — the rule is stopped in our DB; Razorpay webhook will sync eventually.
      logger.warn({ ruleId, err: (err as Error)?.message }, 'subscription_cancel_failed');
    }
  }

  await writeAudit({ userId: session.userId, eventType: 'RULE_STOPPED', payload: { ruleId }, source: 'user' });
  return NextResponse.json({ ok: true });
}
