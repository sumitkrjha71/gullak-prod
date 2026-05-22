// GET /api/gold/portfolio — user's current gold holding with live P&L.
// Returns holding details + last 10 transactions.

import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { getGoldPrice } from '@/lib/gold/price-cache';
import { logger } from '@/lib/logger';

const PROVIDER   = process.env.GOLD_REAL === 'true' ? 'safegold' : 'mock';
const ASSET_TYPE = 'gold';

export async function GET() {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const [holding, price] = await Promise.all([
      prisma.investmentHolding.findUnique({
        where:   { userId_assetType_provider: { userId: session.userId, assetType: ASSET_TYPE, provider: PROVIDER } },
        include: {
          transactions: {
            orderBy: { createdAt: 'desc' },
            take:    10,
          },
        },
      }),
      getGoldPrice(),
    ]);

    const totalGrams = holding ? Number(holding.totalMicrograms) / 1_000_000 : 0;
    const investedPaise = holding ? Number(holding.investedPaise) : 0;

    // Current value = grams × live sell price (what you'd get today)
    const currentValuePaise = holding
      ? Number((holding.totalMicrograms * price.sellPaisePerGram) / 1_000_000n)
      : 0;

    const pnlPaise    = currentValuePaise - investedPaise;
    const pnlPct      = investedPaise > 0 ? ((pnlPaise / investedPaise) * 100).toFixed(2) : '0.00';

    // Persist currentValuePaise so portfolio page can use it without price call
    if (holding && holding.totalMicrograms > 0n) {
      await prisma.investmentHolding.update({
        where: { id: holding.id },
        data:  { currentValuePaise: BigInt(currentValuePaise), lastPricedAt: new Date() },
      });
    }

    return NextResponse.json({
      ok:               true,
      totalGrams:       totalGrams.toFixed(6),
      investedPaise:    investedPaise.toString(),
      investedRs:       (investedPaise / 100).toFixed(2),
      currentValuePaise: currentValuePaise.toString(),
      currentValueRs:   (currentValuePaise / 100).toFixed(2),
      pnlPaise:         pnlPaise.toString(),
      pnlRs:            (pnlPaise / 100).toFixed(2),
      pnlPct,
      avgBuyRsPerGram:  holding
        ? (Number(holding.avgBuyPaisePerGram) / 100).toFixed(2)
        : null,
      livePrice: {
        buyRsPerGram:  (Number(price.buyPaisePerGram) / 100).toFixed(2),
        sellRsPerGram: (Number(price.sellPaisePerGram) / 100).toFixed(2),
        fetchedAt:     price.fetchedAt,
      },
      recentTransactions: (holding?.transactions ?? []).map((t) => ({
        id:          t.id,
        txnType:     t.txnType,
        amountPaise: t.amountPaise.toString(),
        amountRs:    (Number(t.amountPaise) / 100).toFixed(2),
        grams:       t.micrograms ? (Number(t.micrograms) / 1_000_000).toFixed(6) : null,
        pspRefId:    t.pspRefId,
        createdAt:   t.createdAt.toISOString(),
      })),
    });

  } catch (err) {
    logger.error({ route: 'gold/portfolio', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
