// BSE StAR MF transaction seam.
// FUND_REAL=false → mock: instant allotment, fake BSE order numbers.
// FUND_REAL=true  → real BSE StAR MF API (SOAP/REST, needs enterprise credentials).
//
// Units are always in micro-units (×1,000,000) — no floats anywhere.

import crypto from 'crypto';
import { logger } from '@/lib/logger';

export const isFundReal = process.env.FUND_REAL === 'true';

const BSE_CLIENT_CODE  = process.env.BSEMF_CLIENT_CODE  ?? '';
const BSE_PASSWORD     = process.env.BSEMF_PASSWORD     ?? '';
const BSE_MEMBER_ID    = process.env.BSEMF_MEMBER_ID    ?? '';
const BSE_BASE_URL     = process.env.BSEMF_BASE_URL     ?? 'https://bsestarmf.in/';

export type MFBuyResult = {
  pspRefId:   string;   // BSE order number
  microUnits: bigint;   // actual units allotted (may be 0/null until T+1 in real mode)
  navPaise:   bigint;   // NAV used for allotment
  status:     'allotted' | 'pending'; // instant in mock; T+1 in real
  pspRawJson?: string;
};

export type MFRedeemResult = {
  pspRefId:      string;
  creditedPaise: bigint;  // rupees to be credited (T+3)
  microUnits:    bigint;
  status:        'allotted' | 'pending';
  pspRawJson?:   string;
};

// ── Internal REST helper ──────────────────────────────────────────────────────

async function bseFetch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BSE_BASE_URL}${path}`, {
    method:  'POST',
    headers: {
      'Content-Type': 'application/json',
      'UserId':       BSE_CLIENT_CODE,
      'Password':     BSE_PASSWORD,
      'MemberId':     BSE_MEMBER_ID,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json() as T & { Success?: boolean; Message?: string };
  if (!res.ok || (json as { Success?: boolean }).Success === false) {
    throw new Error((json as { Message?: string }).Message ?? `bsemf_api_error:${res.status}`);
  }
  return json;
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Place a mutual fund purchase order.
 * Mock: units = floor(amountPaise × 1_000_000 / navPaise), allotted instantly.
 * Real: submits to BSE StAR MF; units set to 0 until T+1 allotment webhook.
 */
export async function buyMF(
  userId: string,
  schemeCode: string,
  amountPaise: bigint,
  navPaise: bigint,
  idempotencyKey: string,
): Promise<MFBuyResult> {
  // Units = (amountPaise × 1_000_000) / navPaise — pure BigInt, no float
  const microUnits = (amountPaise * 1_000_000n) / navPaise;

  if (!isFundReal) {
    const pspRefId = `BSE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    logger.info({ userId, schemeCode, amountPaise: amountPaise.toString(), microUnits: microUnits.toString(), pspRefId }, 'mf_buy_mock');
    return { pspRefId, microUnits, navPaise, status: 'allotted' };
  }

  type BuyRes = { OrderNo: string; AllotedUnits?: number; NAV?: number };
  const amountRs = (Number(amountPaise) / 100).toFixed(2);
  const res = await bseFetch<BuyRes>('/api/transaction/purchase', {
    UserId:         userId,
    SchemeCode:     schemeCode,
    Amount:         amountRs,
    OrderRefNo:     idempotencyKey,
    TransactionType: 'NEW',
  });

  const rawJson     = JSON.stringify(res);
  const actualUnits = res.AllotedUnits
    ? BigInt(Math.round(res.AllotedUnits * 1_000_000))
    : 0n;
  const actualNav   = res.NAV ? BigInt(Math.round(res.NAV * 100)) : navPaise;

  logger.info({ userId, schemeCode, orderId: res.OrderNo }, 'mf_buy_real');
  return {
    pspRefId:   res.OrderNo,
    microUnits: actualUnits,
    navPaise:   actualNav,
    status:     actualUnits > 0n ? 'allotted' : 'pending',
    pspRawJson: rawJson,
  };
}

/**
 * Place a mutual fund redemption order.
 * Mock: credit = microUnits × navPaise / 1_000_000, instant.
 * Real: T+3 settlement via BSE; creditedPaise is estimated.
 */
export async function redeemMF(
  userId: string,
  schemeCode: string,
  microUnits: bigint,
  navPaise: bigint,
  idempotencyKey: string,
): Promise<MFRedeemResult> {
  const creditedPaise = (microUnits * navPaise) / 1_000_000n;

  if (!isFundReal) {
    const pspRefId = `BSE-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    logger.info({ userId, schemeCode, microUnits: microUnits.toString(), creditedPaise: creditedPaise.toString(), pspRefId }, 'mf_redeem_mock');
    return { pspRefId, creditedPaise, microUnits, status: 'allotted' };
  }

  type RedeemRes = { OrderNo: string; EstimatedAmount?: number };
  const unitsStr = (Number(microUnits) / 1_000_000).toFixed(3);
  const res = await bseFetch<RedeemRes>('/api/transaction/redemption', {
    UserId:         userId,
    SchemeCode:     schemeCode,
    Units:          unitsStr,
    OrderRefNo:     idempotencyKey,
    TransactionType: 'REDEEM',
  });

  const rawJson        = JSON.stringify(res);
  const estimatedPaise = res.EstimatedAmount
    ? BigInt(Math.round(res.EstimatedAmount * 100))
    : creditedPaise;

  logger.info({ userId, schemeCode, orderId: res.OrderNo }, 'mf_redeem_real');
  return {
    pspRefId:      res.OrderNo,
    creditedPaise: estimatedPaise,
    microUnits,
    status:        'pending', // T+3 settlement in real mode
    pspRawJson:    rawJson,
  };
}
