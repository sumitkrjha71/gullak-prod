// Payment abstraction. Today routes to simulate.ts.
// Switching to real rails later = a single import change + a flag flip.

import { prisma } from '@/lib/db/client';
import { simulatePayment, type ExecuteArgs, type SimResult } from './simulate';

export async function validate(args: ExecuteArgs): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (args.amountPaise <= 0) return { ok: false, reason: 'amount_non_positive' };

  const user = await prisma.user.findUnique({ where: { id: args.userId } });
  if (!user) return { ok: false, reason: 'user_not_found' };

  if (args.ruleId) {
    const rule = await prisma.autopilotRule.findUnique({
      where: { id: args.ruleId },
      include: { mandate: true },
    });
    if (!rule) return { ok: false, reason: 'rule_not_found' };
    if (rule.status !== 'active') return { ok: false, reason: 'rule_not_active' };
    if (rule.pauseUntil && rule.pauseUntil > new Date()) return { ok: false, reason: 'rule_paused' };

    if (rule.mandate) {
      if (rule.mandate.revokedAt) return { ok: false, reason: 'mandate_revoked' };
      if (BigInt(args.amountPaise) > rule.mandate.maxPerDebitPaise) {
        return { ok: false, reason: 'amount_over_mandate_cap' };
      }
    }
  }
  return { ok: true };
}

export async function execute(args: ExecuteArgs): Promise<SimResult> {
  const v = await validate(args);
  if (!v.ok) {
    throw new Error(`payment_validation_failed:${v.reason}`);
  }
  return simulatePayment(args);
}
