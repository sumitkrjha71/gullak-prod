// Payment abstraction layer.
// PAYMENTS_REAL=true  → Razorpay (real money, webhook-confirmed)
// PAYMENTS_REAL=false → simulator (mock, safe for dev + demo)
//
// The flag is the only thing that changes between modes — all callers
// use execute() and get back the same SimResult shape either way.

import { prisma } from '@/lib/db/client';
import { simulatePayment, type ExecuteArgs, type SimResult } from './simulate';

export const isPaymentsReal = process.env.PAYMENTS_REAL === 'true';

export async function validate(args: ExecuteArgs): Promise<{ ok: true } | { ok: false; reason: string }> {
  if (args.amountPaise <= 0) return { ok: false, reason: 'amount_non_positive' };

  const user = await prisma.user.findUnique({ where: { id: args.userId } });
  if (!user) return { ok: false, reason: 'user_not_found' };

  // NPCI UPI Autopay daily limit: ₹15,000 per debit
  if (args.amountPaise > 1_500_000) {
    return { ok: false, reason: 'exceeds_upi_autopay_daily_limit' };
  }

  if (args.ruleId) {
    const rule = await prisma.autopilotRule.findUnique({
      where: { id: args.ruleId },
      include: { mandate: true },
    });
    if (!rule)                                     return { ok: false, reason: 'rule_not_found' };
    if (rule.status !== 'active')                  return { ok: false, reason: 'rule_not_active' };
    if (rule.pauseUntil && rule.pauseUntil > new Date()) return { ok: false, reason: 'rule_paused' };

    if (rule.mandate) {
      if (rule.mandate.revokedAt)                          return { ok: false, reason: 'mandate_revoked' };
      if (BigInt(args.amountPaise) > rule.mandate.maxPerDebitPaise) {
        return { ok: false, reason: 'amount_over_mandate_cap' };
      }
    }
  }
  return { ok: true };
}

// execute() is used for automated debits (cron, roundup, sweep).
// For one-time UPI Intent payments initiated by the user, see:
//   POST /api/payments/order  → createOrder()
//   POST /api/webhooks/razorpay → executeReal() called after confirmation
export async function execute(args: ExecuteArgs): Promise<SimResult> {
  const v = await validate(args);
  if (!v.ok) throw new Error(`payment_validation_failed:${v.reason}`);

  if (isPaymentsReal) {
    // Real cron debits land here. The actual payment was initiated by Razorpay
    // Autopay — we just record it after the webhook confirms.
    // For now, real cron debits still use the simulator until UPI Autopay is
    // wired in Phase 3. The flag gates one-time UPI Intent flows.
    return simulatePayment(args);
  }

  return simulatePayment(args);
}

export type { ExecuteArgs, SimResult };
