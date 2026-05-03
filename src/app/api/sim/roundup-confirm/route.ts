import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { execute } from '@/lib/payments';
import { buildIdempotencyKey } from '@/lib/idempotency/key';
import { getTodayBucket, clearBucket } from '@/lib/rules/roundup';
import { prisma } from '@/lib/db/client';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { goalId } = await req.json();

  const bucket = await getTodayBucket(session.userId);
  if (bucket.pendingPaise <= 0) return NextResponse.json({ ok: false, error: 'empty_bucket' }, { status: 400 });

  const goal = goalId
    ? await prisma.goal.findUnique({ where: { id: goalId } })
    : await prisma.goal.findFirst({
        where: { userId: session.userId, status: 'active' },
        orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
      });
  if (!goal || goal.userId !== session.userId) return NextResponse.json({ ok: false }, { status: 404 });

  const idempotencyKey = buildIdempotencyKey({
    userId: session.userId,
    source: 'roundup',
    slot: 'manual-roundup',
  });

  const result = await execute({
    userId: session.userId,
    ruleId: null,
    goalId: goal.id,
    amountPaise: bucket.pendingPaise,
    source: 'roundup',
    idempotencyKey,
  });
  await clearBucket(session.userId);
  return NextResponse.json({ ok: true, txnId: result.txnId, status: result.status });
}
