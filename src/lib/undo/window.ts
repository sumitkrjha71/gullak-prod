// 10-second undo window. Reverses a transaction by writing a compensating
// "reversed" entry that points back to the original; updates goal aggregates.
// Audit-logged.

import { prisma } from '@/lib/db/client';
import { dispatch } from '@/lib/events/bus';
import { buildSimulatedRefId } from '@/lib/idempotency/key';

export const UNDO_WINDOW_MS = 10_000;

export async function undoTransaction(args: { userId: string; transactionId: string }): Promise<{ ok: true } | { ok: false; reason: string }> {
  const txn = await prisma.transaction.findUnique({ where: { id: args.transactionId } });
  if (!txn) return { ok: false, reason: 'not_found' };
  if (txn.userId !== args.userId) return { ok: false, reason: 'forbidden' };
  if (txn.status !== 'success') return { ok: false, reason: 'only_success_can_be_undone' };
  if (txn.reversedAt) return { ok: false, reason: 'already_reversed' };
  const ageMs = Date.now() - txn.createdAt.getTime();
  if (ageMs > UNDO_WINDOW_MS) return { ok: false, reason: 'window_expired' };

  await prisma.$transaction(async (tx) => {
    await tx.transaction.update({
      where: { id: txn.id },
      data: { status: 'reversed', reversedAt: new Date() },
    });
    await tx.transaction.create({
      data: {
        userId: txn.userId,
        goalId: txn.goalId,
        ruleId: txn.ruleId,
        source: 'manual',
        amountPaise: txn.amountPaise,
        status: 'reversed',
        simulatedRefId: buildSimulatedRefId(),
        idempotencyKey: `${txn.idempotencyKey}-rev`,
        reversalOfId: txn.id,
      },
    });
    if (txn.goalId) {
      await tx.goal.update({
        where: { id: txn.goalId },
        data: {
          savedPaise: { decrement: txn.amountPaise },
          investedPaise: { decrement: txn.amountPaise },
          // Keep growthPaise as-is — undo doesn't claw back simulated gains.
        },
      });
    }
  });

  await dispatch({
    userId: args.userId,
    type: 'PAYMENT_REVERSED',
    payload: { txnId: txn.id, reversalOfId: txn.id, amountPaise: Number(txn.amountPaise) },
  });

  return { ok: true };
}
