// The dummy UPI engine. Real-feeling lifecycle: validate → pending → success/failed.
// Audit-logged on entry/exit. Idempotent via Transaction.idempotencyKey @unique.

import { prisma } from '@/lib/db/client';
import { dispatch } from '@/lib/events/bus';
import { writeAudit } from '@/lib/audit/log';
import { buildSimulatedRefId } from '@/lib/idempotency/key';
import { istDateKey } from '@/lib/format/date';

export type PaymentSource = 'fixed' | 'roundup' | 'sweep' | 'manual';
export type FailureReason = 'insufficient_balance' | 'mandate_revoked' | 'network_timeout';

export type SimResult = {
  refId: string;
  status: 'success' | 'failed';
  amountPaise: number;
  failureReason?: FailureReason;
  txnId: string;
  timeline: Array<{ at: string; step: string }>;
  isReplay: boolean; // true when idempotency hit returned a prior result
};

export type ExecuteArgs = {
  userId: string;
  ruleId?: string | null;
  goalId?: string | null;
  amountPaise: number;
  source: PaymentSource;
  idempotencyKey: string;
};

export async function simulatePayment(args: ExecuteArgs): Promise<SimResult> {
  // Idempotency: if a txn with this key already exists, return its result.
  const existing = await prisma.transaction.findUnique({ where: { idempotencyKey: args.idempotencyKey } });
  if (existing) {
    return {
      refId: existing.simulatedRefId,
      status: existing.status === 'success' ? 'success' : 'failed',
      amountPaise: Number(existing.amountPaise),
      failureReason: existing.failureReason as FailureReason | undefined,
      txnId: existing.id,
      timeline: [{ at: new Date().toISOString(), step: 'idempotent_replay' }],
      isReplay: true,
    };
  }

  const refId = buildSimulatedRefId();
  const timeline: SimResult['timeline'] = [{ at: new Date().toISOString(), step: 'intent' }];

  // Insert pending row up-front so concurrent callers hit the unique constraint.
  let txn;
  try {
    txn = await prisma.transaction.create({
      data: {
        userId: args.userId,
        goalId: args.goalId ?? null,
        ruleId: args.ruleId ?? null,
        source: args.source,
        amountPaise: BigInt(args.amountPaise),
        status: 'pending',
        simulatedRefId: refId,
        idempotencyKey: args.idempotencyKey,
      },
    });
  } catch (e) {
    // Concurrent insert lost the race — re-fetch the winner.
    const winner = await prisma.transaction.findUnique({ where: { idempotencyKey: args.idempotencyKey } });
    if (winner) {
      return {
        refId: winner.simulatedRefId,
        status: winner.status === 'success' ? 'success' : 'failed',
        amountPaise: Number(winner.amountPaise),
        failureReason: winner.failureReason as FailureReason | undefined,
        txnId: winner.id,
        timeline: [{ at: new Date().toISOString(), step: 'idempotent_replay_race' }],
        isReplay: true,
      };
    }
    throw e;
  }

  await dispatch({
    userId: args.userId,
    type: 'PAYMENT_TRIGGERED',
    payload: { txnId: txn.id, amountPaise: args.amountPaise, source: args.source },
  });

  // Simulator decision: 95% success, with per-user override.
  const pref = await prisma.userPreference.findUnique({ where: { userId: args.userId } });
  const forceFail = pref?.forceFailNext ?? false;
  const success = !forceFail && Math.random() < 0.95;

  if (forceFail) {
    await prisma.userPreference.update({
      where: { userId: args.userId },
      data: { forceFailNext: false },
    });
  }

  timeline.push({ at: new Date().toISOString(), step: 'debit' });

  if (!success) {
    const reasons: FailureReason[] = ['insufficient_balance', 'mandate_revoked', 'network_timeout'];
    const reason: FailureReason = forceFail ? 'insufficient_balance' : reasons[Math.floor(Math.random() * reasons.length)];
    await prisma.transaction.update({
      where: { id: txn.id },
      data: { status: 'failed', failureReason: reason },
    });
    timeline.push({ at: new Date().toISOString(), step: 'failed' });
    await dispatch({
      userId: args.userId,
      type: 'PAYMENT_FAILED',
      payload: { txnId: txn.id, amountPaise: args.amountPaise, reason, source: args.source },
    });
    return {
      refId,
      status: 'failed',
      amountPaise: args.amountPaise,
      failureReason: reason,
      txnId: txn.id,
      timeline,
      isReplay: false,
    };
  }

  // Success path. Apply tiny deterministic growth on the new invested portion.
  // Growth factor: 0.0002 per day, hashed by date so replay stays reproducible.
  const dateKey = istDateKey();
  const growthDeltaPaise = Math.floor(args.amountPaise * 0.0002 * deterministicJitter(dateKey, args.userId));

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: txn.id },
      data: { status: 'success' },
    });
    if (args.goalId) {
      await tx.goal.update({
        where: { id: args.goalId },
        data: {
          savedPaise: { increment: BigInt(args.amountPaise) },
          investedPaise: { increment: BigInt(args.amountPaise) },
          growthPaise: { increment: BigInt(growthDeltaPaise) },
        },
      });
    }
  });

  timeline.push({ at: new Date().toISOString(), step: 'settled' });
  await dispatch({
    userId: args.userId,
    type: 'PAYMENT_SUCCESS',
    payload: { txnId: txn.id, amountPaise: args.amountPaise, goalId: args.goalId ?? undefined, source: args.source },
  });
  await writeAudit({
    userId: args.userId,
    eventType: 'TXN_CREATED',
    payload: { txnId: txn.id, refId, amountPaise: args.amountPaise, source: args.source, status: 'success' },
    source: 'system',
  });

  return {
    refId,
    status: 'success',
    amountPaise: args.amountPaise,
    txnId: txn.id,
    timeline,
    isReplay: false,
  };
}

function deterministicJitter(dateKey: string, userId: string): number {
  // Returns a number in [0.5, 1.5] from a stable hash of date+user.
  let h = 0;
  const s = `${dateKey}-${userId}`;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return 0.5 + ((h % 1000) / 1000);
}
