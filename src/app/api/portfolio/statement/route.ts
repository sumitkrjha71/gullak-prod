// GET /api/portfolio/statement — full portfolio statement with XIRR.
// Returns gold holding, MF holdings per fund, goals, and overall XIRR.
// Used by the Portfolio screen and downloadable statement.

import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { computeXirr, formatXirr, type Cashflow } from '@/lib/portfolio/xirr';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const { userId } = session;

    // Fetch all data in parallel
    const [goldHolding, mfHoldings, goldTxns, mfTxns, goals, riskProfile] = await Promise.all([
      prisma.investmentHolding.findFirst({
        where: { userId, assetType: 'gold' },
      }),
      prisma.mFHolding.findMany({
        where:   { userId },
        include: { fund: { select: { schemeName: true, amcName: true, category: true, riskCategory: true, navDate: true, expenseRatioBps: true } } },
      }),
      prisma.investmentTransaction.findMany({
        where:   { userId, assetType: 'gold' },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.mFTransaction.findMany({
        where:   { userId },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.goal.findMany({
        where: { userId, status: { not: 'stopped' } },
      }),
      prisma.riskProfile.findUnique({ where: { userId } }),
    ]);

    // ── Gold ─────────────────────────────────────────────────────────────────
    let goldSection: Record<string, unknown> = { held: false };
    if (goldHolding && goldHolding.totalMicrograms > 0n) {
      const goldCashflows: Cashflow[] = goldTxns.map(t => ({
        amountPaise: t.txnType === 'buy'
          ? -t.amountPaise                  // outflows are negative
          : t.amountPaise,                  // inflows are positive
        date: t.createdAt,
      }));
      // Add current value as a fictitious sell today (standard XIRR convention)
      goldCashflows.push({
        amountPaise: (goldHolding.totalMicrograms * goldHolding.avgBuyPaisePerGram) / 1_000_000n,
        date:        new Date(),
      });

      const goldXirr = computeXirr(goldCashflows);
      const totalGrams = (Number(goldHolding.totalMicrograms) / 1_000_000).toFixed(6);

      goldSection = {
        held:         true,
        totalGrams,
        investedRs:   (Number(goldHolding.investedPaise) / 100).toFixed(2),
        currentRs:    (Number(goldHolding.totalMicrograms) * Number(goldHolding.avgBuyPaisePerGram) / 1_000_000 / 100).toFixed(2),
        avgBuyPriceRs: (Number(goldHolding.avgBuyPaisePerGram) / 100).toFixed(2),
        xirr:         formatXirr(goldXirr),
        xirrRaw:      goldXirr,
      };
    }

    // ── Mutual Funds ─────────────────────────────────────────────────────────
    const mfByScheme: Record<string, Cashflow[]> = {};
    for (const t of mfTxns) {
      if (!mfByScheme[t.schemeCode]) mfByScheme[t.schemeCode] = [];
      const isRedeem = t.txnType === 'redeem';
      mfByScheme[t.schemeCode].push({
        amountPaise: isRedeem ? t.amountPaise : -t.amountPaise,
        date:        t.createdAt,
      });
    }

    let totalMfInvestedPaise = 0n;
    let totalMfCurrentPaise  = 0n;

    const mfSection = mfHoldings.map(h => {
      totalMfInvestedPaise += h.investedPaise;
      totalMfCurrentPaise  += h.currentValuePaise;

      const cfs = mfByScheme[h.schemeCode] ?? [];
      // Add current value as fictitious sell today
      if (h.currentValuePaise > 0n) {
        cfs.push({ amountPaise: h.currentValuePaise, date: new Date() });
      }
      const xirr = computeXirr(cfs);
      const unrealizedPnlPaise = h.currentValuePaise - h.investedPaise;
      const unrealizedPct = h.investedPaise > 0n
        ? ((Number(unrealizedPnlPaise) / Number(h.investedPaise)) * 100).toFixed(2)
        : '0.00';

      return {
        schemeCode:      h.schemeCode,
        schemeName:      h.fund.schemeName,
        amcName:         h.fund.amcName,
        category:        h.fund.category,
        riskCategory:    h.fund.riskCategory,
        units:           (Number(h.totalMicroUnits) / 1_000_000).toFixed(4),
        avgNavRs:        (Number(h.avgNavPaise) / 100).toFixed(4),
        latestNavDate:   h.fund.navDate,
        investedRs:      (Number(h.investedPaise) / 100).toFixed(2),
        currentValueRs:  (Number(h.currentValuePaise) / 100).toFixed(2),
        unrealizedPnlRs: (Number(unrealizedPnlPaise) / 100).toFixed(2),
        unrealizedPct,
        xirr:            formatXirr(xirr),
        xirrRaw:         xirr,
        expenseRatioNote: `${(h.fund.expenseRatioBps / 100).toFixed(2)}% p.a.`,
      };
    });

    // ── Overall XIRR ─────────────────────────────────────────────────────────
    const allCashflows: Cashflow[] = [
      ...goldTxns.map(t => ({
        amountPaise: t.txnType === 'buy' ? -t.amountPaise : t.amountPaise,
        date:        t.createdAt,
      })),
      ...mfTxns.map(t => ({
        amountPaise: t.txnType === 'redeem' ? t.amountPaise : -t.amountPaise,
        date:        t.createdAt,
      })),
    ];
    const totalCurrentPaise = (goldHolding?.currentValuePaise ?? 0n) + totalMfCurrentPaise;
    if (totalCurrentPaise > 0n) {
      allCashflows.push({ amountPaise: totalCurrentPaise, date: new Date() });
    }
    const overallXirr = computeXirr(allCashflows);

    const totalInvestedPaise  = (goldHolding?.investedPaise ?? 0n) + totalMfInvestedPaise;
    const totalUnrealizedPnl  = totalCurrentPaise - totalInvestedPaise;

    // ── Goals ────────────────────────────────────────────────────────────────
    const goalsSection = goals.map(g => ({
      id:            g.id,
      title:         g.title,
      targetPaise:   g.targetPaise?.toString() ?? null,
      investedPaise: g.investedPaise.toString(),
      progressPct:   g.targetPaise && g.targetPaise > 0n
        ? ((Number(g.investedPaise) / Number(g.targetPaise)) * 100).toFixed(1)
        : null,
    }));

    logger.info({ userId, mfFunds: mfHoldings.length, goldHeld: !!goldHolding }, 'portfolio_statement_fetched');

    return NextResponse.json({
      ok:        true,
      asOf:      new Date().toISOString(),
      summary: {
        totalInvestedRs:  (Number(totalInvestedPaise) / 100).toFixed(2),
        totalCurrentRs:   (Number(totalCurrentPaise) / 100).toFixed(2),
        totalUnrealizedPnlRs: (Number(totalUnrealizedPnl) / 100).toFixed(2),
        overallXirr:      formatXirr(overallXirr),
        overallXirrRaw:   overallXirr,
      },
      gold:          goldSection,
      mutualFunds:   mfSection,
      goals:         goalsSection,
      riskProfile:   riskProfile ? { profile: riskProfile.profile, score: riskProfile.score } : null,
      disclosures: {
        sebiWarning: 'Mutual Fund investments are subject to market risks. Past performance is not indicative of future returns.',
        xirrNote:    'XIRR (Extended Internal Rate of Return) is an annualised return metric that accounts for the timing of all cash flows.',
        navNote:     'Current values are based on last available NAV. Actual redemption value may vary.',
      },
    });

  } catch (err) {
    logger.error({ route: 'portfolio/statement', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
