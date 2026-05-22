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
