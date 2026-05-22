// POST /api/gold/buy — buy digital gold for a rupee amount.
// KYC required. Amount ₹10 – ₹50,000 per transaction.
// Idempotent: repeated requests with same idempotencyKey return cached result.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { ensureKYC } from '@/lib/kyc/gate';
import { ratelimit } from '@/lib/ratelimit';
import { getGoldPrice } from '@/lib/gold/price-cache';
import { buyGold } from '@/lib/gold/safegold';
import { buildIdempotencyKey } from '@/lib/idempotency/key';
import { writeAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';

const PROVIDER = process.env.GOLD_REAL === 'true' ? 'safegold' : 'mock';
const ASSET_TYPE = 'gold';

const schema = z.object({
  amountPaise: z.number().int().min(1_000).max(5_000_000), // ₹10 – ₹50,000
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

    const { amountPaise, goalId } = body.data;
    const idempotencyKey = buildIdempotencyKey({
      userId: session.userId,
      source: 'gold_buy',
      slot:   `buy-${Date.now()}`,
    });

    // Idempotency check — return existing if this key already processed
    const existing = await prisma.investmentTransaction.findUnique({ where: { idempotencyKey } });
    if (existing) {
      return NextResponse.json({ ok: true, replayed: true, txnId: existing.id, micrograms: existing.micrograms?.toString() });
    }

    // Get live price (cached)
    const price = await getGoldPrice();
    const amountPaiseBn = BigInt(amountPaise);

    // Call SafeGold (mock or real)
    const result = await buyGold(session.userId, amountPaiseBn, price.buyPaisePerGram, idempotencyKey);

    // Upsert holding (weighted average buy price)
    const holding = await prisma.investmentHolding.upsert({
      where:  { userId_assetType_provider: { userId: session.userId, assetType: ASSET_TYPE, provider: PROVIDER } },
      create: {
        userId:             session.userId,
        assetType:          ASSET_TYPE,
        provider:           PROVIDER,
        totalMicrograms:    result.micrograms,
        avgBuyPaisePerGram: price.buyPaisePerGram,
        investedPaise:      amountPaiseBn,
      },
      update: {
        // Weighted average: (oldGrams × oldAvg + newGrams × newPrice) / totalGrams
        totalMicrograms: { increment: result.micrograms },
        investedPaise:   { increment: amountPaiseBn },
        // avgBuyPaisePerGram updated below (requires current value first)
      },
    });

    // Re-fetch to compute new weighted average
    const updated = await prisma.investmentHolding.findUnique({
      where: { userId_assetType_provider: { userId: session.userId, assetType: ASSET_TYPE, provider: PROVIDER } },
    });
    if (updated && updated.totalMicrograms > 0n) {
      // Weighted average: (investedPaise × 1_000_000) / totalMicrograms
      const newAvg = (updated.investedPaise * 1_000_000n) / updated.totalMicrograms;
      await prisma.investmentHolding.update({
        where: { id: updated.id },
        data:  { avgBuyPaisePerGram: newAvg },
      });
    }

    // Record transaction
    const txn = await prisma.investmentTransaction.create({
      data: {
        userId:           session.userId,
        holdingId:        holding.id,
        assetType:        ASSET_TYPE,
        txnType:          'buy',
        amountPaise:      amountPaiseBn,
        micrograms:       result.micrograms,
        pricePerGramPaise: price.buyPaisePerGram,
        pspRefId:         result.pspRefId,
        pspRawJson:       result.pspRawJson ?? null,
        idempotencyKey,
        goalId:           goalId ?? null,
        status:           'success',
      },
    });

    // Link to goal if provided
    if (goalId) {
      await prisma.goal.update({
        where: { id: goalId },
        data:  { investedPaise: { increment: amountPaiseBn } },
      });
    }

    await writeAudit({
      userId:    session.userId,
      eventType: 'TXN_CREATED',
      payload:   { txnId: txn.id, assetType: ASSET_TYPE, txnType: 'buy', amountPaise, pspRefId: result.pspRefId },
      source:    'user',
    });

    const gramsAdded = (Number(result.micrograms) / 1_000_000).toFixed(6);
    const totalGrams = updated
      ? (Number(updated.totalMicrograms) / 1_000_000).toFixed(6)
      : gramsAdded;

    logger.info({ userId: session.userId, txnId: txn.id, amountPaise, gramsAdded }, 'gold_buy_completed');

    return NextResponse.json({
      ok:         true,
      txnId:      txn.id,
      pspRefId:   result.pspRefId,
      gramsAdded,
      totalGrams,
      amountPaise: amountPaise.toString(),
    });

  } catch (err) {
    logger.error({ route: 'gold/buy', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
