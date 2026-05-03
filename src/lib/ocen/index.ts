// Mock OCEN (Open Credit Enablement Network) layer.
// 5 loan products (Two-wheeler / Four-wheeler / Gold / Consumer-Durable / Emergency).
// 3 mock NBFC partners. Surface matches what a real LSP/OCEN integration would return.

import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';
import { dispatch } from '@/lib/events/bus';
import crypto from 'crypto';
import type { AAAccountSnapshot } from '@/lib/aa';

export type LoanProductType =
  | 'two-wheeler'
  | 'four-wheeler'
  | 'gold'
  | 'consumer-durable'
  | 'emergency';

const MOCK_NBFCS = ['Bharat Loans (mock)', 'IndieFin NBFC (mock)', 'GullakPartners (mock)'];

export type Offer = {
  id: string;
  productType: LoanProductType;
  productName: string;
  principalPaise: number;
  tenureDays: number;
  interestPctBps: number;
  emiPaise: number;
  lenderName: string;
  expiresAt: string;
};

/** Seed product catalogue once. Idempotent. */
export async function ensureProductsSeeded() {
  const products: Array<{
    type: LoanProductType;
    name: string;
    minAmountPaise: number;
    maxAmountPaise: number;
    minTenureDays: number;
    maxTenureDays: number;
    baseRatePctBps: number;
  }> = [
    { type: 'two-wheeler', name: 'Two-Wheeler Loan', minAmountPaise: 30_000_00, maxAmountPaise: 3_00_000_00, minTenureDays: 365, maxTenureDays: 365 * 3, baseRatePctBps: 1400 },
    { type: 'four-wheeler', name: 'Four-Wheeler Loan', minAmountPaise: 1_00_000_00, maxAmountPaise: 15_00_000_00, minTenureDays: 365, maxTenureDays: 365 * 5, baseRatePctBps: 1100 },
    { type: 'gold', name: 'Gold Loan', minAmountPaise: 25_000_00, maxAmountPaise: 5_00_000_00, minTenureDays: 90, maxTenureDays: 365, baseRatePctBps: 950 },
    { type: 'consumer-durable', name: 'Consumer Durable Loan', minAmountPaise: 5_000_00, maxAmountPaise: 50_000_00, minTenureDays: 90, maxTenureDays: 365 * 2, baseRatePctBps: 1700 },
    { type: 'emergency', name: 'Emergency Credit Line', minAmountPaise: 5_000_00, maxAmountPaise: 1_00_000_00, minTenureDays: 30, maxTenureDays: 180, baseRatePctBps: 1800 },
  ];
  for (const p of products) {
    await prisma.loanProduct.upsert({
      where: { type: p.type },
      update: { name: p.name, minAmountPaise: BigInt(p.minAmountPaise), maxAmountPaise: BigInt(p.maxAmountPaise), minTenureDays: p.minTenureDays, maxTenureDays: p.maxTenureDays, baseRatePctBps: p.baseRatePctBps, active: true },
      create: { type: p.type, name: p.name, minAmountPaise: BigInt(p.minAmountPaise), maxAmountPaise: BigInt(p.maxAmountPaise), minTenureDays: p.minTenureDays, maxTenureDays: p.maxTenureDays, baseRatePctBps: p.baseRatePctBps },
    });
  }
}

/** Compute simple-interest EMI in paise for principal × rate × tenureDays. */
export function computeEmi(principalPaise: number, ratePctBps: number, tenureDays: number): number {
  const months = Math.max(1, Math.ceil(tenureDays / 30));
  const r = ratePctBps / 10000 / 12; // monthly rate
  if (r === 0) return Math.ceil(principalPaise / months);
  const emi = (principalPaise * r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
  return Math.round(emi);
}

/** Derive an indicative offered rate from base rate + AA-derived risk signals. */
export function deriveRate(baseRateBps: number, snapshot: AAAccountSnapshot | null): number {
  if (!snapshot) return baseRateBps + 200; // higher rate without AA data
  let bps = baseRateBps;
  if (snapshot.salaryDetected) bps -= 150;
  if (snapshot.averageBalancePaise > 5_00_000_00) bps -= 75;
  if (snapshot.emiCount > 1) bps += 100;
  return Math.max(700, bps); // floor at 7%
}

/** Search for offers — returns deterministic mock offers from 3 NBFCs per product. */
export async function searchOffers({
  userId,
  productType,
  amountPaise,
  tenureDays,
  snapshot,
}: {
  userId: string;
  productType: LoanProductType;
  amountPaise: number;
  tenureDays: number;
  snapshot: AAAccountSnapshot | null;
}): Promise<Offer[]> {
  const product = await prisma.loanProduct.findUnique({ where: { type: productType } });
  if (!product) return [];

  const principal = Math.min(Math.max(amountPaise, Number(product.minAmountPaise)), Number(product.maxAmountPaise));
  const tenure = Math.min(Math.max(tenureDays, product.minTenureDays), product.maxTenureDays);
  const baseRate = deriveRate(product.baseRatePctBps, snapshot);

  const offers: Offer[] = [];
  for (let i = 0; i < MOCK_NBFCS.length; i++) {
    const ratePctBps = baseRate + (i - 1) * 50;
    const emi = computeEmi(principal, ratePctBps, tenure);
    const created = await prisma.loanOffer.create({
      data: {
        userId,
        productType,
        principalPaise: BigInt(principal),
        tenureDays: tenure,
        interestPctBps: ratePctBps,
        emiPaise: BigInt(emi),
        lenderName: MOCK_NBFCS[i],
        status: 'PRE_APPROVED',
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
    offers.push({
      id: created.id,
      productType,
      productName: product.name,
      principalPaise: principal,
      tenureDays: tenure,
      interestPctBps: ratePctBps,
      emiPaise: emi,
      lenderName: MOCK_NBFCS[i],
      expiresAt: created.expiresAt.toISOString(),
    });
  }
  return offers;
}

export async function applyForLoan({ userId, offerId, formPayload }: { userId: string; offerId: string; formPayload: Record<string, unknown> }) {
  const offer = await prisma.loanOffer.findUnique({ where: { id: offerId } });
  if (!offer || offer.userId !== userId) throw new Error('offer_not_found');
  if (offer.status !== 'PRE_APPROVED') throw new Error('offer_not_active');

  const idempotencyKey = crypto.createHash('sha256').update(`${userId}|${offerId}|apply`).digest('hex').slice(0, 32);

  // Idempotency: if already applied, return prior application.
  const existing = await prisma.loanApplication.findUnique({ where: { idempotencyKey } });
  if (existing) {
    return { applicationId: existing.id, status: existing.status, isReplay: true };
  }

  const app = await prisma.loanApplication.create({
    data: {
      offerId,
      userId,
      status: 'APPROVED',
      idempotencyKey,
      payload: JSON.stringify(formPayload),
    },
  });
  await prisma.loanOffer.update({ where: { id: offerId }, data: { status: 'APPLIED' } });
  await writeAudit({
    userId,
    eventType: 'TXN_CREATED',
    payload: { kind: 'loan_application', applicationId: app.id, offerId, productType: offer.productType, principalPaise: Number(offer.principalPaise) },
    source: 'user',
  });
  await dispatch({ userId, type: 'AUTOPILOT_SET', payload: { ruleId: app.id, mode: 'loan-applied' } });
  return { applicationId: app.id, status: app.status, isReplay: false };
}

export async function disburse(applicationId: string) {
  const app = await prisma.loanApplication.findUnique({ where: { id: applicationId }, include: { offer: true } });
  if (!app) throw new Error('not_found');
  await prisma.loanApplication.update({
    where: { id: applicationId },
    data: { status: 'DISBURSED', disbursedAt: new Date() },
  });
  await prisma.loanOffer.update({ where: { id: app.offerId }, data: { status: 'DISBURSED' } });
  await writeAudit({
    userId: app.userId,
    eventType: 'TXN_CREATED',
    payload: { kind: 'loan_disbursed', applicationId, principalPaise: Number(app.offer.principalPaise) },
    source: 'system',
  });
  return { ok: true };
}

export async function listOffers(userId: string) {
  return prisma.loanOffer.findMany({
    where: { userId, status: { in: ['PRE_APPROVED', 'APPLIED', 'DISBURSED'] } },
    orderBy: { createdAt: 'desc' },
  });
}
