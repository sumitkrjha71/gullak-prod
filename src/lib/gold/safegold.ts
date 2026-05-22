// SafeGold API seam — Digital Gold buy/sell via SafeGold B2B API.
// GOLD_REAL=false (default) → mock mode: deterministic prices, fake order IDs.
// GOLD_REAL=true + SAFEGOLD_API_KEY set → real SafeGold API calls.
//
// All amounts: paise for money, micrograms for gold weight.

import crypto from 'crypto';
import { logger } from '@/lib/logger';

export const isGoldReal = process.env.GOLD_REAL === 'true';

const SAFEGOLD_BASE_URL  = process.env.SAFEGOLD_BASE_URL ?? 'https://app.safegold.com/api/v1';
const SAFEGOLD_API_KEY   = process.env.SAFEGOLD_API_KEY  ?? '';
const SAFEGOLD_MERCHANT_ID = process.env.SAFEGOLD_MERCHANT_ID ?? '';

// ── Price constants (mock) ────────────────────────────────────────────────────
// Approximate India gold rate, May 2026 (~₹7,800/gram). Spread ~2%.
export const MOCK_BUY_PAISE_PER_GRAM  = 780_000n; // ₹7,800
export const MOCK_SELL_PAISE_PER_GRAM = 764_400n; // ₹7,644 (2% spread)

export type GoldPrice = {
  buyPaisePerGram:  bigint;
  sellPaisePerGram: bigint;
  fetchedAt:        string;   // ISO timestamp
};

export type GoldBuyResult = {
  pspRefId:    string;  // SafeGold order ID
  micrograms:  bigint;  // grams actually credited (provider may round)
  pspRawJson?: string;
};

export type GoldSellResult = {
  pspRefId:       string;
  creditedPaise:  bigint; // actual rupees credited to user's linked account
  micrograms:     bigint;
  pspRawJson?:    string;
};

// ── Internal REST helper ──────────────────────────────────────────────────────

async function sgFetch<T>(path: string, method: 'GET' | 'POST', body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${SAFEGOLD_BASE_URL}${path}`, {
    method,
    headers: {
      'Authorization': `Bearer ${SAFEGOLD_API_KEY}`,
      'X-Merchant-Id': SAFEGOLD_MERCHANT_ID,
      'Content-Type':  'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await res.json() as T & { error?: string; message?: string };
  if (!res.ok) {
    const msg = (json as { error?: string; message?: string }).error ?? (json as { message?: string }).message ?? `safegold_api_error:${res.status}`;
    throw new Error(msg);
  }
  return json;
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Fetch live buy/sell price from SafeGold API. */
export async function fetchLiveGoldPrice(): Promise<GoldPrice> {
  if (!isGoldReal) {
    return {
      buyPaisePerGram:  MOCK_BUY_PAISE_PER_GRAM,
      sellPaisePerGram: MOCK_SELL_PAISE_PER_GRAM,
      fetchedAt:        new Date().toISOString(),
    };
  }

  type PriceRes = { buy_price: number; sell_price: number; updated_at?: string };
  const data = await sgFetch<PriceRes>('/price', 'GET');

  return {
    buyPaisePerGram:  BigInt(Math.round(data.buy_price * 100)),
    sellPaisePerGram: BigInt(Math.round(data.sell_price * 100)),
    fetchedAt:        data.updated_at ?? new Date().toISOString(),
  };
}

/**
 * Buy gold by rupee amount. SafeGold credits the equivalent grams to the
 * merchant's pooled vault; we record micrograms in our DB.
 *
 * @param amountPaise  - money to spend
 * @param buyPaisePerGram - current buy price (from cache)
 * @param idempotencyKey  - our unique key; sent as merchant_ref to SafeGold
 */
export async function buyGold(
  userId: string,
  amountPaise: bigint,
  buyPaisePerGram: bigint,
  idempotencyKey: string,
): Promise<GoldBuyResult> {
  // Calculate micrograms: (amountPaise × 1_000_000) / buyPaisePerGram
  const micrograms = (amountPaise * 1_000_000n) / buyPaisePerGram;

  if (!isGoldReal) {
    const pspRefId = `SG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    logger.info({ userId, amountPaise: amountPaise.toString(), micrograms: micrograms.toString(), pspRefId }, 'gold_buy_mock');
    return { pspRefId, micrograms };
  }

  type BuyRes = { order_id: string; gold_grams: number; raw?: string };
  const amountRs = (Number(amountPaise) / 100).toFixed(2);
  const res = await sgFetch<BuyRes>('/buy', 'POST', {
    user_id:      userId,
    amount:       amountRs,
    merchant_ref: idempotencyKey,
  });

  const rawJson = JSON.stringify(res);
  // SafeGold returns actual grams credited (may differ slightly due to spread)
  const actualMicrograms = BigInt(Math.round(res.gold_grams * 1_000_000));

  logger.info({ userId, amountPaise: amountPaise.toString(), orderId: res.order_id }, 'gold_buy_real');
  return { pspRefId: res.order_id, micrograms: actualMicrograms, pspRawJson: rawJson };
}

/**
 * Sell gold by grams. SafeGold credits the rupee equivalent to the user's
 * linked bank account (or Gullak wallet in mock mode).
 */
export async function sellGold(
  userId: string,
  micrograms: bigint,
  sellPaisePerGram: bigint,
  idempotencyKey: string,
): Promise<GoldSellResult> {
  const creditedPaise = (micrograms * sellPaisePerGram) / 1_000_000n;

  if (!isGoldReal) {
    const pspRefId = `SG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    logger.info({ userId, micrograms: micrograms.toString(), creditedPaise: creditedPaise.toString(), pspRefId }, 'gold_sell_mock');
    return { pspRefId, creditedPaise, micrograms };
  }

  type SellRes = { order_id: string; credited_amount: number };
  const gramsStr = (Number(micrograms) / 1_000_000).toFixed(4);
  const res = await sgFetch<SellRes>('/sell', 'POST', {
    user_id:      userId,
    gold_grams:   gramsStr,
    merchant_ref: idempotencyKey,
  });

  const rawJson = JSON.stringify(res);
  const actualCredited = BigInt(Math.round(res.credited_amount * 100));

  logger.info({ userId, micrograms: micrograms.toString(), orderId: res.order_id }, 'gold_sell_real');
  return { pspRefId: res.order_id, creditedPaise: actualCredited, micrograms, pspRawJson: rawJson };
}
