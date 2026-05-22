// Razorpay integration — UPI Intent (one-time) + UPI Autopay (mandate).
// Set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in env to go live.
// Both vars absent → mock mode (safe for local dev and demo).

import crypto from 'crypto';
import Razorpay from 'razorpay';
import { logger } from '@/lib/logger';

const KEY_ID     = process.env.RAZORPAY_KEY_ID     ?? '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? '';

export const isRazorpayEnabled = Boolean(KEY_ID && KEY_SECRET);

function getClient(): Razorpay {
  if (!isRazorpayEnabled) throw new Error('Razorpay not configured — set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET');
  return new Razorpay({ key_id: KEY_ID, key_secret: KEY_SECRET });
}

// ── Order creation (step 1 of UPI Intent flow) ───────────────────────────────

export type CreateOrderResult = {
  orderId:     string;
  amount:      number; // paise
  currency:    string;
  keyId:       string; // sent to client for Razorpay checkout
};

export async function createOrder(amountPaise: number, receipt: string): Promise<CreateOrderResult> {
  const rz = getClient();
  const order = await rz.orders.create({
    amount:   amountPaise,
    currency: 'INR',
    receipt,
    payment_capture: true,
  });
  logger.info({ orderId: order.id, amountPaise }, 'razorpay_order_created');
  return { orderId: order.id, amount: amountPaise, currency: 'INR', keyId: KEY_ID };
}

// ── HMAC signature verification (webhook + payment verification) ─────────────

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET ?? '')
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string): boolean {
  const payload  = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac('sha256', KEY_SECRET).update(payload).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

// ── Internal REST helper (SDK TypeScript types are incomplete for subscriptions) ─

async function rzFetch<T = Record<string, unknown>>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!isRazorpayEnabled) throw new Error('Razorpay not configured');
  const creds = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${creds}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json() as T & { error?: { description: string } };
  if (!res.ok) throw new Error((json as { error?: { description: string } }).error?.description ?? `razorpay_api_error:${res.status}`);
  return json;
}

// ── UPI Autopay — Plan + Subscription (Phase 3) ───────────────────────────────
// Flow: createPlan → createSubscription → return short_url to user → user
// authorises in UPI app → subscription.authenticated webhook → ACTIVE.
// On each billing cycle Razorpay fires subscription.charged → we record in DB.

export type CreatePlanResult   = { planId: string };
export type CreateSubResult    = { subscriptionId: string; shortUrl: string };

/** One plan per rule (not shared). amount in paise. period: daily | weekly | monthly. */
export async function createPlan(
  amountPaise: number,
  period: 'daily' | 'weekly' | 'monthly',
  notes: Record<string, string> = {},
): Promise<CreatePlanResult> {
  type PlanRes = { id: string };
  const res = await rzFetch<PlanRes>('/plans', {
    period,
    interval: 1,
    item: {
      name:        'Gullak Autopilot',
      amount:      amountPaise,
      currency:    'INR',
      description: `Autopilot ${period} save`,
    },
    notes,
  });
  logger.info({ planId: res.id, amountPaise, period }, 'razorpay_plan_created');
  return { planId: res.id };
}

/**
 * Creates a subscription under the plan. startAt is a Unix timestamp (IST 6 AM
 * next day) so the first debit fires after the user has authorised overnight.
 */
export async function createSubscription(
  planId: string,
  startAt: number,
  notes: Record<string, string> = {},
): Promise<CreateSubResult> {
  type SubRes = { id: string; short_url: string };
  const res = await rzFetch<SubRes>('/subscriptions', {
    plan_id:         planId,
    total_count:     1200,     // ~3.3 years of daily debits
    start_at:        startAt,
    customer_notify: 1,        // Razorpay sends auth link to user via SMS/email too
    notes,
  });
  logger.info({ subscriptionId: res.id, planId }, 'razorpay_subscription_created');
  return { subscriptionId: res.id, shortUrl: res.short_url };
}

/** Cancel a subscription (called when user stops the autopilot rule). */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  await rzFetch(`/subscriptions/${subscriptionId}/cancel`, { cancel_at_cycle_end: 0 });
  logger.info({ subscriptionId }, 'razorpay_subscription_cancelled');
}

// ── UPI Intent deeplink (no Razorpay account needed — pure NPCI standard) ────
// Opens the system UPI app picker (GPay, PhonePe, Paytm, BHIM, Cred).
// Works only on mobile — desktop has no UPI app to open the intent.

export type UPIIntentParams = {
  vpa:         string; // payee VPA e.g. gullak@icici
  payeeName:   string;
  amountRs:    string; // rupees as string e.g. "50.00"
  refId:       string; // transaction reference
  description: string;
};

export function buildUPIIntentUrl(p: UPIIntentParams): string {
  const params = new URLSearchParams({
    pa:  p.vpa,
    pn:  p.payeeName,
    am:  p.amountRs,
    tr:  p.refId,
    tn:  p.description,
    cu:  'INR',
    mc:  '6211', // MCC for financial services
  });
  return `upi://pay?${params.toString()}`;
}
