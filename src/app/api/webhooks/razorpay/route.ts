// Razorpay webhook handler.
// Security: every request verified with HMAC-SHA256 before any DB writes.
// Idempotent: WebhookEvent.eventId @unique prevents double-processing.
//
// Handled events:
//   payment.captured          → one-time UPI Intent payment confirmed
//   payment.failed            → mark pending transaction failed
//   subscription.authenticated → mandate authorised by user → ACTIVE
//   subscription.charged      → recurring debit confirmed → record transaction
//   subscription.halted       → too many debit failures → HALTED, notify user
//   subscription.cancelled    → user/merchant cancelled → REVOKED
//   subscription.completed    → total_count exhausted → EXPIRED

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { verifyWebhookSignature } from '@/lib/payments/razorpay';
import { executeReal } from '@/lib/payments/real';
import { writeAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const rawBody   = await req.text();
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

  // ── 2. Idempotency: store raw event ──────────────────────────────────────
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
    switch (eventType) {
      case 'payment.captured':
        await handlePaymentCaptured(event, rawBody);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event);
        break;
      case 'subscription.authenticated':
        await handleSubscriptionAuthenticated(event);
        break;
      case 'subscription.charged':
        await handleSubscriptionCharged(event, rawBody);
        break;
      case 'subscription.halted':
        await handleSubscriptionStatusChange(event, 'HALTED');
        break;
      case 'subscription.cancelled':
        await handleSubscriptionStatusChange(event, 'REVOKED');
        break;
      case 'subscription.completed':
        await handleSubscriptionStatusChange(event, 'EXPIRED');
        break;
      default:
        // Unhandled events are logged and ACKed — Razorpay retries on non-200.
        logger.info({ eventId, eventType }, 'webhook_unhandled_event');
    }

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
    // Return 200 — we've logged; don't let Razorpay retry endlessly.
    return NextResponse.json({ ok: false, error: msg }, { status: 200 });
  }
}

// ── One-time payment handlers ─────────────────────────────────────────────────

async function handlePaymentCaptured(event: Record<string, unknown>, rawBody: string) {
  const payload    = event.payload as Record<string, Record<string, unknown>>;
  const payment    = payload?.payment?.entity as Record<string, unknown>;
  if (!payment) return;

  const pspRefId    = String(payment.id ?? '');
  const pspOrderId  = String(payment.order_id ?? '');
  const amountPaise = Number(payment.amount ?? 0);
  const notes       = payment.notes as Record<string, string> ?? {};

  const userId         = notes.userId;
  const idempotencyKey = notes.idempotencyKey;
  const goalId         = notes.goalId ?? null;
  const source         = (notes.source ?? 'manual') as 'manual' | 'burst' | 'shagun';

  if (!userId || !idempotencyKey) {
    logger.warn({ pspRefId }, 'webhook_missing_notes');
    return;
  }

  await executeReal({ userId, goalId, ruleId: null, amountPaise, source, idempotencyKey, pspRefId, pspOrderId, pspRawJson: rawBody });
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

// ── Subscription (UPI Autopay) handlers ──────────────────────────────────────

/** User completed UPI Autopay auth → mandate is now live. */
async function handleSubscriptionAuthenticated(event: Record<string, unknown>) {
  const payload      = event.payload as Record<string, Record<string, unknown>>;
  const sub          = payload?.subscription?.entity as Record<string, unknown>;
  if (!sub) return;

  const subscriptionId = String(sub.id ?? '');
  const urn            = String((sub as Record<string, unknown>).upi_mandate_urn ?? '');

  const updated = await prisma.mandate.updateMany({
    where: { pspSubscriptionId: subscriptionId },
    data:  {
      status:          'ACTIVE',
      activatedAt:     new Date(),
      upiMandateUrn:   urn || null,
    },
  });

  logger.info({ subscriptionId, updated: updated.count }, 'mandate_activated');

  // Write audit for each affected mandate's user.
  if (updated.count > 0) {
    const mandate = await prisma.mandate.findFirst({ where: { pspSubscriptionId: subscriptionId } });
    if (mandate) {
      await writeAudit({
        userId:    mandate.userId,
        eventType: 'MANDATE_ACTIVATED',
        payload:   { subscriptionId, upiMandateUrn: urn || null },
        source:    'system',
      });
    }
  }
}

/**
 * Razorpay debited the user on schedule → record as a real transaction.
 * We look up the mandate by subscription_id to get userId/goalId/ruleId.
 * The Razorpay payment_id is the idempotency key — globally unique.
 */
async function handleSubscriptionCharged(event: Record<string, unknown>, rawBody: string) {
  const payload    = event.payload as Record<string, Record<string, unknown>>;
  const payment    = payload?.payment?.entity as Record<string, unknown>;
  const sub        = payload?.subscription?.entity as Record<string, unknown>;
  if (!payment || !sub) return;

  const subscriptionId = String(sub.id ?? '');
  const pspRefId       = String(payment.id ?? '');
  const amountPaise    = Number(payment.amount ?? 0);

  // Resolve mandate → rule → user/goal
  const mandate = await prisma.mandate.findFirst({
    where:   { pspSubscriptionId: subscriptionId },
    include: { rule: true },
  });

  if (!mandate) {
    logger.warn({ subscriptionId, pspRefId }, 'subscription_charged_mandate_not_found');
    return;
  }

  // pspRefId (pay_xxx) is the natural idempotency key for each charge.
  await executeReal({
    userId:        mandate.userId,
    goalId:        mandate.rule.goalId,
    ruleId:        mandate.ruleId,
    amountPaise,
    source:        mandate.rule.mode as 'fixed' | 'sweep',
    idempotencyKey: pspRefId,
    pspRefId,
    pspOrderId:    String(payment.order_id ?? ''),
    pspRawJson:    rawBody,
  });

  logger.info({ subscriptionId, pspRefId, amountPaise }, 'subscription_charge_recorded');
}

/** HALTED | REVOKED | EXPIRED — update mandate status and audit. */
async function handleSubscriptionStatusChange(
  event: Record<string, unknown>,
  newStatus: 'HALTED' | 'REVOKED' | 'EXPIRED',
) {
  const payload      = event.payload as Record<string, Record<string, unknown>>;
  const sub          = payload?.subscription?.entity as Record<string, unknown>;
  if (!sub) return;

  const subscriptionId = String(sub.id ?? '');

  const updated = await prisma.mandate.updateMany({
    where: { pspSubscriptionId: subscriptionId },
    data:  {
      status:    newStatus,
      revokedAt: newStatus === 'REVOKED' ? new Date() : undefined,
    },
  });

  logger.info({ subscriptionId, newStatus, updated: updated.count }, 'mandate_status_changed');

  if (updated.count > 0) {
    const mandate = await prisma.mandate.findFirst({ where: { pspSubscriptionId: subscriptionId } });
    if (mandate) {
      await writeAudit({
        userId:    mandate.userId,
        eventType: `MANDATE_${newStatus}`,
        payload:   { subscriptionId, newStatus },
        source:    'system',
      });
    }
  }
}
