// POST /api/mf/redeem — redeem mutual fund units.
// KYC required. User must hold sufficient units.
// Real mode: T+3 settlement. Mock: instant credit.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { ensureKYC } from '@/lib/kyc/gate';
import { ratelimit } from '@/lib/ratelimit';
import { redeemMF } from '@/lib/mf/bsemf';
import { buildIdempotencyKey } from '@/lib/idempotency/key';
import { writeAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';

// Accept units as string to preserve precision; converted to micro-units.
const schema = z.object({
  schemeCode:   z.string().min(1).max(20),
  unitsToRedeem: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Up to 6 decimal places'),
  goalId:       z.string().cuid().optional(),
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

    const { schemeCode, unitsToRedeem, goalId } = body.data;
    const microUnitsToRedeem = BigInt(Math.floor(parseFloat(unitsToRedeem) * 1_000_000));

    if (microUnitsToRedeem <= 0n) {
      return NextResponse.json({ ok: false, error: 'invalid_units' }, { status: 400 });
    }

    // Check holding
    const [holding, fund] = await Promise.all([
      prisma.mFHolding.findUnique({ where: { userId_schemeCode: { userId: session.userId, schemeCode } } }),
      prisma.mutualFund.findUnique({ where: { schemeCode } }),
    ]);

    if (!holding || holding.totalMicroUnits < microUnitsToRedeem) {
      return NextResponse.json({ ok: false, error: 'insufficient_units' }, { status: 422 });
    }
    if (!fund || fund.navPaise === 0n) {
      return NextResponse.json({ ok: false, error: 'nav_not_available' }, { status: 503 });
    }

    // ELSS lock-in: 3-year lock from first purchase. Uses setFullYear to handle
    // leap years correctly (365×3 days would drift by ~18 hours over 3 years).
    // In real mode BSE StAR MF also enforces this server-side.
    if (fund.category === 'elss') {
      const lockInExpiry = new Date(holding.createdAt);
      lockInExpiry.setFullYear(lockInExpiry.getFullYear() + 3);
      if (new Date() < lockInExpiry) {
        const expiryDateStr = lockInExpiry.toISOString().slice(0, 10);
        return NextResponse.json({ ok: false, error: 'elss_lock_in', lockInExpiresOn: expiryDateStr }, { status: 422 });
      }
    }

    // Client must send X-Idempotency-Key (UUID) before submitting. This ensures
    // retries reuse the same key and don't create duplicate transactions.
    const clientKey = req.headers.get('x-idempotency-key') ?? crypto.randomUUID();
    const idempotencyKey = buildIdempotencyKey({
      userId: session.userId,
      source: 'mf_redeem',
      slot:   clientKey,
    });

    const existing = await prisma.mFTransaction.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return NextResponse.json({ ok: true, replayed: true, txnId: existing.id });
    }

    const result = await redeemMF(session.userId, schemeCode, microUnitsToRedeem, fund.navPaise, idempotencyKey);

    // Proportional cost-basis reduction
    const investedReduction = (microUnitsToRedeem * holding.investedPaise) / holding.totalMicroUnits;

    await prisma.mFHolding.update({
      where: { id: holding.id },
      data:  {
        totalMicroUnits: { decrement: microUnitsToRedeem },
        investedPaise:   { decrement: investedReduction },
      },
    });

    const txn = await prisma.mFTransaction.create({
      data: {
        userId:        session.userId,
        schemeCode,
        txnType:       'redeem',
        amountPaise:   result.creditedPaise,
        microUnits:    microUnitsToRedeem,
        navPaise:      fund.navPaise,
        pspRefId:      result.pspRefId,
        pspRawJson:    result.pspRawJson ?? null,
        status:        result.status,
        idempotencyKey,
        goalId:        goalId ?? null,
      },
    });

    if (goalId) {
      await prisma.goal.update({ where: { id: goalId }, data: { investedPaise: { decrement: investedReduction } } });
    }

    await writeAudit({
      userId:    session.userId,
      eventType: 'TXN_CREATED',
      payload:   { txnId: txn.id, assetType: 'mf', txnType: 'redeem', schemeCode, unitsToRedeem, creditedPaise: result.creditedPaise.toString() },
      source:    'user',
    });

    logger.info({ userId: session.userId, txnId: txn.id, schemeCode, unitsToRedeem }, 'mf_redeem_completed');

    // Exit load disclosure
    const exitLoadNote = fund.exitLoadPct > 0
      ? `Exit load of ${(fund.exitLoadPct / 100).toFixed(2)}% applied if redeemed within ${fund.exitLoadDays} days of purchase.`
      : 'No exit load on this fund.';

    return NextResponse.json({
      ok:            true,
      txnId:         txn.id,
      pspRefId:      result.pspRefId,
      creditedPaise: result.creditedPaise.toString(),
      creditedRs:    (Number(result.creditedPaise) / 100).toFixed(2),
      unitsRedeemed: unitsToRedeem,
      status:        result.status,
      disclosures: {
        settlementNote: 'Redemption proceeds are credited to your bank account in T+3 business days.',
        taxNote:        'Short-term capital gains (held < 1 year) taxed at 20%. Long-term gains (> 1 year) taxed at 12.5% above ₹1.25L. Please consult a tax advisor.',
        exitLoadNote,
      },
    });

  } catch (err) {
    logger.error({ route: 'mf/redeem', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
