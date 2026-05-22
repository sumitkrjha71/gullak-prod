// Razorpay webhook handler.
// Security: every request verified with HMAC-SHA256 before any DB writes.
// Idempotent: WebhookEvent.eventId @unique prevents double-processing.

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { verifyWebhookSignature } from '@/lib/payments/razorpay';
import { executeReal } from '@/lib/payments/real';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const signature = req.headers.get('x-razorpay-signature') ?? '';

  // ── 1. Verify signature ───────────────────────────────────────────────────
  if (!verifyWebhookSignature(rawBody, signature)) {
    logger.warn({ route: 'webhooks/razorpay' }, 'invalid_signature');
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }

  const eventId   = String(event.id ?? '');
  const eventType = String(event.event ?? '');

  // ── 2. Idempotency: store raw event (upsert on eventId) ──────────────────
  const existing = await prisma.webhookEvent.findUnique({ where: { eventId } });
  if (existing?.processedAt) {
    logger.info({ eventId, eventType }, 'webhook_already_processed');
    return NextResponse.json({ ok: true, replayed: true });
  }

  await prisma.webhookEvent.upsert({
    where:  { eventId },
    create: { provider: 'razorpay', eventId, eventType, rawJson: rawBody },
    update: {},
  });

  // ── 3. Handle event types ─────────────────────────────────────────────────
  try {
    if (eventType === 'payment.captured') {
      await handlePaymentCaptured(event, rawBody);
    } else if (eventType === 'payment.failed') {
      await handlePaymentFailed(event);
    }
    // mandate.* events handled in Phase 3 when UPI Autopay is wired

    await prisma.webhookEvent.update({
      where: { eventId },
      data:  { processedAt: new Date() },
    });

    logger.info({ eventId, eventType }, 'webhook_processed');
    return NextResponse.json({ ok: true });

  } catch (err) {
    const msg = (err as Error)?.message ?? 'unknown';
    await prisma.webhookEvent.update({
      where: { eventId },
      data:  { errorMsg: msg },
    });
    logger.error({ eventId, eventType, err: msg }, 'webhook_processing_failed');
    // Return 200 so Razorpay doesn't retry — we've logged the failure.
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}

// ── Handlers ──────────────────────────────────────────────────────────────────

async function handlePaymentCaptured(event: Record<string, unknown>, rawBody: string) {
  const payload   = event.payload as Record<string, Record<string, unknown>>;
  const payment   = payload?.payment?.entity as Record<string, unknown>;
  if (!payment) return;

  const pspRefId   = String(payment.id ?? '');
  const pspOrderId = String(payment.order_id ?? '');
  const amountPaise = Number(payment.amount ?? 0);
  const notes      = payment.notes as Record<string, string> ?? {};

  // Our order notes must include userId + idempotencyKey set at order creation.
  const userId         = notes.userId;
  const idempotencyKey = notes.idempotencyKey;
  const goalId         = notes.goalId ?? null;
  const source         = (notes.source ?? 'manual') as 'manual' | 'burst' | 'shagun';

  if (!userId || !idempotencyKey) {
    logger.warn({ pspRefId }, 'webhook_missing_notes');
    return;
  }

  await executeReal({
    userId,
    goalId,
    ruleId:        null,
    amountPaise,
    source,
    idempotencyKey,
    pspRefId,
    pspOrderId,
    pspRawJson:    rawBody,
  });
}

async function handlePaymentFailed(event: Record<string, unknown>) {
  const payload  = event.payload as Record<string, Record<string, unknown>>;
  const payment  = payload?.payment?.entity as Record<string, unknown>;
  if (!payment) return;

  const idempotencyKey = String((payment.notes as Record<string, string>)?.idempotencyKey ?? '');
  if (!idempotencyKey) return;

  await prisma.transaction.updateMany({
    where: { idempotencyKey, status: 'pending' },
    data:  { status: 'failed', failureReason: String(payment.error_code ?? 'psp_failed') },
  });
}
