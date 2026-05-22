// POST /api/mf/buy — invest in a mutual fund (lumpsum or SIP installment).
// KYC required. Amount ≥ fund's minSipPaise. Max ₹1,00,000 per transaction.
// Uses current on-disk NAV (updated daily by nav-sync cron).

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { ensureKYC } from '@/lib/kyc/gate';
import { ratelimit } from '@/lib/ratelimit';
import { buyMF } from '@/lib/mf/bsemf';
import { buildIdempotencyKey } from '@/lib/idempotency/key';
import { writeAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';

const schema = z.object({
  schemeCode:  z.string().min(1).max(20),
  amountPaise: z.number().int().min(50000).max(10_000_000), // ₹500 – ₹1,00,000
  txnType:     z.enum(['buy', 'sip_installment']).default('buy'),
  goalId:      z.string().cuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const kycGate = await ensureKYC(session.userId);
    if (kycGate) return kycGate;

    const rl = await ratelimit.mf(session.userId);
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: 'too_many_requests' }, { status: 429 });
    }

    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ ok: false, error: 'invalid_input', details: body.error.flatten() }, { status: 400 });
    }

    const { schemeCode, amountPaise, txnType, goalId } = body.data;

    // Validate fund exists and amount meets minimum
    const fund = await prisma.mutualFund.findUnique({ where: { schemeCode } });
    if (!fund || !fund.isActive) {
      return NextResponse.json({ ok: false, error: 'fund_not_found' }, { status: 404 });
    }
    if (BigInt(amountPaise) < fund.minSipPaise) {
      return NextResponse.json({
        ok: false,
        error: 'below_minimum',
        minRs: (Number(fund.minSipPaise) / 100).toFixed(0),
      }, { status: 422 });
    }
    if (fund.navPaise === 0n) {
      return NextResponse.json({ ok: false, error: 'nav_not_available' }, { status: 503 });
    }

    const amountPaiseBn = BigInt(amountPaise);
    const idempotencyKey = buildIdempotencyKey({
      userId: session.userId,
      source: 'mf_buy',
      slot:   `${schemeCode}-${Date.now()}`,
    });

    // Idempotency check
    const existing = await prisma.mFTransaction.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return NextResponse.json({ ok: true, replayed: true, txnId: existing.id });
    }

    // Execute via BSE StAR MF seam
    const result = await buyMF(session.userId, schemeCode, amountPaiseBn, fund.navPaise, idempotencyKey);

    const { userId } = session;

    // Upsert MFHolding
    await prisma.mFHolding.upsert({
      where:  { userId_schemeCode: { userId, schemeCode } },
      create: {
        userId,
        schemeCode,
        totalMicroUnits:   result.microUnits,
        avgNavPaise:       result.navPaise,
        investedPaise:     amountPaiseBn,
        currentValuePaise: result.microUnits > 0n
          ? (result.microUnits * fund.navPaise) / 1_000_000n
          : amountPaiseBn,
      },
      update: {
        totalMicroUnits: { increment: result.microUnits },
        investedPaise:   { increment: amountPaiseBn },
        // avgNavPaise recalculated below
      },
    });

    // Recalculate weighted average NAV
    const updated = await prisma.mFHolding.findUnique({ where: { userId_schemeCode: { userId, schemeCode } } });
    if (updated && updated.totalMicroUnits > 0n) {
      // avgNav = (investedPaise × 1_000_000) / totalMicroUnits
      const newAvgNav = (updated.investedPaise * 1_000_000n) / updated.totalMicroUnits;
      await prisma.mFHolding.update({ where: { id: updated.id }, data: { avgNavPaise: newAvgNav } });
    }

    // Record transaction
    const txn = await prisma.mFTransaction.create({
      data: {
        userId,
        schemeCode,
        txnType,
        amountPaise:   amountPaiseBn,
        microUnits:    result.microUnits,
        navPaise:      result.navPaise,
        pspRefId:      result.pspRefId,
        pspRawJson:    result.pspRawJson ?? null,
        status:        result.status,
        idempotencyKey,
        goalId:        goalId ?? null,
      },
    });

    // Link to goal
    if (goalId) {
      await prisma.goal.update({ where: { id: goalId }, data: { investedPaise: { increment: amountPaiseBn } } });
    }

    await writeAudit({
      userId,
      eventType: 'TXN_CREATED',
      payload:   { txnId: txn.id, assetType: 'mf', txnType, schemeCode, amountPaise, pspRefId: result.pspRefId },
      source:    'user',
    });

    const unitsAdded = result.microUnits > 0n
      ? (Number(result.microUnits) / 1_000_000).toFixed(4)
      : 'pending_allotment';

    logger.info({ userId, txnId: txn.id, schemeCode, amountPaise, status: result.status }, 'mf_buy_completed');

    return NextResponse.json({
      ok:          true,
      txnId:       txn.id,
      pspRefId:    result.pspRefId,
      unitsAdded,
      navRs:       (Number(result.navPaise) / 100).toFixed(4),
      status:      result.status,
      amountPaise: amountPaise.toString(),
    });

  } catch (err) {
    logger.error({ route: 'mf/buy', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
