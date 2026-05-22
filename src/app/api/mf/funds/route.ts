// GET /api/mf/funds — returns the curated fund list with current NAVs.
// Drives the fund picker in the Kaagaz investment flow.

import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

// Human-readable category labels for the UI.
const CATEGORY_LABELS: Record<string, string> = {
  index:  'Index Fund',
  equity: 'Equity',
  elss:   'Tax Saver (ELSS)',
  liquid: 'Liquid / Parking',
  hybrid: 'Balanced Hybrid',
  debt:   'Debt',
};

// Bharat-voice one-liners shown under each fund in the picker.
const CATEGORY_TAGLINES: Record<string, string> = {
  index:  'Nifty ke saath chalte raho — sabse sasta, sabse bharosemand',
  equity: 'Long term mein paisa double karne ka plan',
  elss:   '₹1.5 lakh tak tax bachao + returns — double fayda',
  liquid: 'Emergency fund parking — anytime nikalo',
  hybrid: 'Thoda equity, thoda debt — balanced growth',
  debt:   'Fixed returns, kam risk — steady chal',
};

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  try {
    const funds = await prisma.mutualFund.findMany({
      where:   { isCurated: true, isActive: true },
      orderBy: { category: 'asc' },
    });

    return NextResponse.json({
      ok:    true,
      funds: funds.map((f) => ({
        schemeCode:   f.schemeCode,
        schemeName:   f.schemeName,
        amcName:      f.amcName,
        category:     f.category,
        subCategory:  f.subCategory,
        categoryLabel: CATEGORY_LABELS[f.category] ?? f.category,
        tagline:      CATEGORY_TAGLINES[f.category] ?? '',
        navRs:        (Number(f.navPaise) / 100).toFixed(4),
        navDate:      f.navDate,
        minSipRs:     (Number(f.minSipPaise) / 100).toFixed(0),
        // Whether the catalog has been seeded yet
        seeded:       f.navPaise > 0n,
      })),
      // If no funds seeded yet, tell the client to hit /api/cron/nav-sync first.
      hint: funds.length === 0 ? 'run_nav_sync_first' : null,
    });

  } catch (err) {
    logger.error({ route: 'mf/funds', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
