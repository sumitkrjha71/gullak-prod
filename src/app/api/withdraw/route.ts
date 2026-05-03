import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';
import { dispatch } from '@/lib/events/bus';
import { buildSimulatedRefId } from '@/lib/idempotency/key';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { goalId, amountPaise } = await req.json();
  if (typeof goalId !== 'string' || typeof amountPaise !== 'number' || amountPaise <= 0) {
    return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });
  }

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || goal.userId !== session.userId) {
    return NextResponse.json({ ok: false, error: 'not_found' }, { status: 404 });
  }
  if (BigInt(amountPaise) > goal.savedPaise) {
    return NextResponse.json({ ok: false, error: 'amount_exceeds_balance' }, { status: 400 });
  }

  const refId = buildSimulatedRefId();
  const idempotencyKey = crypto
    .createHash('sha256')
    .update(`${session.userId}|withdraw|${goalId}|${amountPaise}|${Date.now()}`)
    .digest('hex')
    .slice(0, 32);

  const txn = await prisma.$transaction(async (tx) => {
    const created = await tx.transaction.create({
      data: {
        userId: session.userId,
        goalId,
        ruleId: null,
        source: 'withdrawal',
        amountPaise: BigInt(amountPaise),
        status: 'success',
        simulatedRefId: refId,
        idempotencyKey,
      },
    });
    await tx.goal.update({
      where: { id: goalId },
      data: {
        savedPaise: { decrement: BigInt(amountPaise) },
        investedPaise: { decrement: BigInt(amountPaise) },
      },
    });
    return created;
  });

  await writeAudit({
    userId: session.userId,
    eventType: 'TXN_CREATED',
    payload: { kind: 'withdrawal', txnId: txn.id, goalId, amountPaise },
    source: 'user',
  });
  await dispatch({
    userId: session.userId,
    type: 'PAYMENT_SUCCESS',
    payload: { txnId: txn.id, amountPaise, goalId, source: 'withdrawal' },
  });

  return NextResponse.json({
    ok: true,
    refId,
    txnId: txn.id,
    expectedCredit: new Date(Date.now() + 86400000).toISOString(),
  });
}
