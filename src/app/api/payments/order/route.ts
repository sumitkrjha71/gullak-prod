// Creates a Razorpay order for UPI Intent one-time payments.
// Flow: client calls this → gets orderId + keyId → opens Razorpay checkout
// → user pays via any UPI app → Razorpay fires webhook → we record in DB.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readSession } from '@/lib/auth/session';
import { createOrder, buildUPIIntentUrl, isRazorpayEnabled } from '@/lib/payments/razorpay';
import { buildIdempotencyKey } from '@/lib/idempotency/key';
import { logger } from '@/lib/logger';

const PAYEE_VPA  = process.env.GULLAK_UPI_VPA  ?? 'gullak@icici';
const PAYEE_NAME = process.env.GULLAK_UPI_NAME ?? 'Gullak';

const schema = z.object({
  amountPaise: z.number().int().min(100).max(1_500_000), // ₹1 – ₹15,000
  goalId:      z.string().cuid().optional(),
  source:      z.enum(['burst', 'shagun', 'manual']),
  description: z.string().max(100).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ ok: false, error: 'invalid_input', details: body.error.flatten() }, { status: 400 });
    }

    const { amountPaise, goalId, source, description } = body.data;
    const idempotencyKey = buildIdempotencyKey({ userId: session.userId, source, slot: `${source}-${Date.now()}` });
    const amountRs = (amountPaise / 100).toFixed(2);

    // UPI Intent deeplink — works without Razorpay account, opens system picker
    const intentUrl = buildUPIIntentUrl({
      vpa:         PAYEE_VPA,
      payeeName:   PAYEE_NAME,
      amountRs,
      refId:       idempotencyKey,
      description: description ?? `Gullak ${source}`,
    });

    if (!isRazorpayEnabled) {
      // Dev/demo mode: return the intent URL only (no real order)
      return NextResponse.json({ ok: true, mode: 'mock', intentUrl, idempotencyKey });
    }

    // Real mode: create Razorpay order and embed our metadata in notes
    const order = await createOrder(amountPaise, idempotencyKey);

    // Notes are passed back in the webhook so we can match payment → user
    const notes = { userId: session.userId, idempotencyKey, goalId: goalId ?? '', source };

    logger.info({ userId: session.userId, orderId: order.orderId, amountPaise }, 'payment_order_created');

    return NextResponse.json({
      ok:             true,
      mode:           'real',
      orderId:        order.orderId,
      keyId:          order.keyId,
      amountPaise:    order.amount,
      currency:       order.currency,
      intentUrl,
      notes,
      idempotencyKey,
    });

  } catch (err) {
    logger.error({ route: 'payments/order', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
