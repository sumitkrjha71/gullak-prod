// POST /api/gold/sell — sell digital gold by gram weight.
// KYC required. User must hold sufficient grams.
// Proceeds credited to user's linked bank account (via SafeGold) in real mode,
// or deducted from goal.investedPaise in mock mode.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { ensureKYC } from '@/lib/kyc/gate';
import { ratelimit } from '@/lib/ratelimit';
import { getGoldPrice } from '@/lib/gold/price-cache';
import { sellGold } from '@/lib/gold/safegold';
import { buildIdempotencyKey } from '@/lib/idempotency/key';
import { writeAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';

const PROVIDER   = process.env.GOLD_REAL === 'true' ? 'safegold' : 'mock';
const ASSET_TYPE = 'gold';

// Accept grams as a string to preserve precision; we convert to micrograms.
const schema = z.object({
  gramsToSell: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Must be a number with up to 6 decimal places'),
  goalId:      z.string().cuid().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const kycGate = await ensureKYC(session.userId);
    if (kycGate) return kycGate;

    const rl = await ratelimit.gold(session.userId);
    if (!rl.allowed) {
      return NextResponse.json({ ok: false, error: 'too_many_requests' }, { status: 429 });
    }

    const body = schema.safeParse(await req.json());
    if (!body.success) {
      return NextResponse.json({ ok: false, error: 'invalid_input', details: body.error.flatten() }, { status: 400 });
    }

    const { gramsToSell, goalId } = body.data;
    // Convert grams string to micrograms BigInt (multiply by 1_000_000, truncate decimals)
    const microgramsToSell = BigInt(Math.floor(parseFloat(gramsToSell) * 1_000_000));

    if (microgramsToSell <= 0n) {
      return NextResponse.json({ ok: false, error: 'invalid_grams' }, { status: 400 });
    }

    // Check holding
    const holding = await prisma.investmentHolding.findUnique({
      where: { userId_assetType_provider: { userId: session.userId, assetType: ASSET_TYPE, provider: PROVIDER } },
    });

    if (!holding || holding.totalMicrograms < microgramsToSell) {
      return NextResponse.json({ ok: false, error: 'insufficient_gold' }, { status: 422 });
    }

    // Client must send X-Idempotency-Key (UUID) before submitting.
    const clientKey = req.headers.get('x-idempotency-key') ?? crypto.randomUUID();
    const idempotencyKey = buildIdempotencyKey({
      userId: session.userId,
      source: 'gold_sell',
      slot:   clientKey,
    });

    const existing = await prisma.investmentTransaction.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return NextResponse.json({ ok: true, replayed: true, txnId: existing.id });
    }

    // Get live sell price
    const price = await getGoldPrice();

    // Execute sell via SafeGold (mock or real)
    const result = await sellGold(session.userId, microgramsToSell, price.sellPaisePerGram, idempotencyKey);

    // Proportionally reduce investedPaise: (soldMicrograms / totalMicrograms) × investedPaise
    const investedReduction = (microgramsToSell * holding.investedPaise) / holding.totalMicrograms;

    await prisma.investmentHolding.update({
      where: { id: holding.id },
      data:  {
        totalMicrograms: { decrement: microgramsToSell },
        investedPaise:   { decrement: investedReduction },
        // Avg buy price unchanged on sell — reflects cost basis of remaining gold
      },
    });

    // Record transaction
    const txn = await prisma.investmentTransaction.create({
      data: {
        userId:            session.userId,
        holdingId:         holding.id,
        assetType:         ASSET_TYPE,
        txnType:           'sell',
        amountPaise:       result.creditedPaise,
        micrograms:        microgramsToSell,
        pricePerGramPaise: price.sellPaisePerGram,
        pspRefId:          result.pspRefId,
        pspRawJson:        result.pspRawJson ?? null,
        idempotencyKey,
        goalId:            goalId ?? null,
        status:            'success',
      },
    });

    // Reduce linked goal's investedPaise proportionally
    if (goalId) {
      await prisma.goal.update({
        where: { id: goalId },
        data:  { investedPaise: { decrement: investedReduction } },
      });
    }

    await writeAudit({
      userId:    session.userId,
      eventType: 'TXN_CREATED',
      payload:   { txnId: txn.id, assetType: ASSET_TYPE, txnType: 'sell', gramsToSell, creditedPaise: result.creditedPaise.toString(), pspRefId: result.pspRefId },
      source:    'user',
    });

    logger.info({ userId: session.userId, txnId: txn.id, gramsToSell, creditedPaise: result.creditedPaise.toString() }, 'gold_sell_completed');

    return NextResponse.json({
      ok:            true,
      txnId:         txn.id,
      pspRefId:      result.pspRefId,
      creditedPaise: result.creditedPaise.toString(),
      creditedRs:    (Number(result.creditedPaise) / 100).toFixed(2),
      gramsSold:     gramsToSell,
      disclosures: {
        priceNote:      `Sell price: ₹${(Number(price.sellPaisePerGram) / 100).toFixed(2)}/g (after spread).`,
        settlementNote: 'Proceeds credited to your registered bank account within 1–2 business days.',
        taxNote:        'Capital gains apply. Gains on gold held > 3 years are long-term (20% with indexation). Please consult a tax advisor.',
      },
    });

  } catch (err) {
    logger.error({ route: 'gold/sell', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
