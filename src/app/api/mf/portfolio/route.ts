// GET /api/mf/portfolio — all MF holdings with live NAV-based P&L.

import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    const session = await readSession();
    if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

    const holdings = await prisma.mFHolding.findMany({
      where:   { userId: session.userId, totalMicroUnits: { gt: 0n } },
      include: { fund: true },
      orderBy: { createdAt: 'asc' },
    });

    const items = holdings.map((h) => {
      const totalUnits     = Number(h.totalMicroUnits) / 1_000_000;
      const investedPaise  = Number(h.investedPaise);
      const currentValue   = h.fund.navPaise > 0n
        ? Number((h.totalMicroUnits * h.fund.navPaise) / 1_000_000n)
        : investedPaise;
      const pnlPaise       = currentValue - investedPaise;
      const pnlPct         = investedPaise > 0 ? ((pnlPaise / investedPaise) * 100).toFixed(2) : '0.00';

      return {
        schemeCode:        h.schemeCode,
        schemeName:        h.fund.schemeName,
        amcName:           h.fund.amcName,
        category:          h.fund.category,
        totalUnits:        totalUnits.toFixed(4),
        avgNavRs:          (Number(h.avgNavPaise) / 100).toFixed(4),
        currentNavRs:      (Number(h.fund.navPaise) / 100).toFixed(4),
        navDate:           h.fund.navDate,
        investedPaise:     investedPaise.toString(),
        investedRs:        (investedPaise / 100).toFixed(2),
        currentValuePaise: currentValue.toString(),
        currentValueRs:    (currentValue / 100).toFixed(2),
        pnlPaise:          pnlPaise.toString(),
        pnlRs:             (pnlPaise / 100).toFixed(2),
        pnlPct,
      };
    });

    const totalInvested     = items.reduce((s, i) => s + Number(i.investedPaise), 0);
    const totalCurrentValue = items.reduce((s, i) => s + Number(i.currentValuePaise), 0);
    const totalPnl          = totalCurrentValue - totalInvested;

    return NextResponse.json({
      ok:       true,
      holdings: items,
      summary: {
        totalInvestedRs:    (totalInvested / 100).toFixed(2),
        totalCurrentValueRs: (totalCurrentValue / 100).toFixed(2),
        totalPnlRs:         (totalPnl / 100).toFixed(2),
        totalPnlPct:        totalInvested > 0 ? ((totalPnl / totalInvested) * 100).toFixed(2) : '0.00',
        fundCount:          items.length,
      },
    });

  } catch (err) {
    logger.error({ route: 'mf/portfolio', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
