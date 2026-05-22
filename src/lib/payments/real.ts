// Real payment execution via Razorpay.
// Called by payments/index.ts when PAYMENTS_REAL=true.
// Triggered AFTER the Razorpay webhook confirms payment.captured —
// this function records the confirmed payment in our DB (idempotent).

import { prisma } from '@/lib/db/client';
import { dispatch } from '@/lib/events/bus';
import { writeAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';
import type { ExecuteArgs, SimResult } from './simulate';

export async function executeReal(args: ExecuteArgs & {
  pspRefId:   string;
  pspOrderId: string;
  pspRawJson?: string;
}): Promise<SimResult> {
  // Idempotency — if this pspRefId already landed, return the existing row.
  const existing = await prisma.transaction.findUnique({
    where: { idempotencyKey: args.idempotencyKey },
  });
  if (existing) {
    return {
      refId:     existing.pspRefId ?? existing.simulatedRefId,
      status:    existing.status === 'success' ? 'success' : 'failed',
      amountPaise: Number(existing.amountPaise),
      txnId:     existing.id,
      timeline:  [{ at: new Date().toISOString(), step: 'idempotent_replay' }],
      isReplay:  true,
    };
  }

  const txn = await prisma.transaction.create({
    data: {
      userId:        args.userId,
      goalId:        args.goalId ?? null,
      ruleId:        args.ruleId ?? null,
      source:        args.source,
      amountPaise:   BigInt(args.amountPaise),
      status:        'success',
      pspRefId:      args.pspRefId,
      pspOrderId:    args.pspOrderId,
      pspRawJson:    args.pspRawJson ?? null,
      simulatedRefId: '',
      idempotencyKey: args.idempotencyKey,
    },
  });

  // Update goal balance
  if (args.goalId) {
    await prisma.goal.update({
      where: { id: args.goalId },
      data: {
        savedPaise:    { increment: BigInt(args.amountPaise) },
        investedPaise: { increment: BigInt(args.amountPaise) },
      },
    });
  }

  await dispatch({
    userId: args.userId,
    type:   'PAYMENT_SUCCESS',
    payload: { txnId: txn.id, amountPaise: args.amountPaise, goalId: args.goalId ?? undefined, source: args.source },
  });

  await writeAudit({
    userId:    args.userId,
    eventType: 'TXN_CREATED',
    payload:   { txnId: txn.id, pspRefId: args.pspRefId, amountPaise: args.amountPaise, source: args.source, status: 'success' },
    source:    'system',
  });

  logger.info({ txnId: txn.id, pspRefId: args.pspRefId, amountPaise: args.amountPaise }, 'real_payment_recorded');

  return {
    refId:      args.pspRefId,
    status:     'success',
    amountPaise: args.amountPaise,
    txnId:      txn.id,
    timeline:   [
      { at: new Date().toISOString(), step: 'psp_confirmed' },
      { at: new Date().toISOString(), step: 'db_recorded' },
    ],
    isReplay: false,
  };
}
