// NAV sync + curated fund seeding.
// Calls mfapi.in (free public AMFI wrapper) for each curated fund.
// Upserts the fund catalog on first run — no separate seed step needed.
//
// mfapi.in endpoint: GET https://api.mfapi.in/mf/{schemeCode}
// Response: { meta: { scheme_name, fund_house }, data: [{ date, nav }, ...] }
// First element in data[] is the most recent NAV.

import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

// ── Curated fund list ─────────────────────────────────────────────────────────
// Scheme codes from AMFI. Verify at: https://www.amfindia.com/nav-history
// These represent the five core categories Gullak surfaces to users.
export const CURATED_FUNDS = [
  {
    schemeCode:      '122639',
    schemeName:      'Parag Parikh Flexi Cap Fund — Direct Growth',
    amcName:         'PPFAS Mutual Fund',
    category:        'equity',
    subCategory:     'flexi_cap',
    minSipPaise:     100000n, // ₹1,000
    // SEBI Riskometer: very_high (flexi-cap equity)
    riskCategory:    'very_high',
    // 1% exit load if redeemed within 365 days; NIL after
    exitLoadPct:     100,
    exitLoadDays:    365,
    // Direct plan expense ratio as per latest AMFI disclosure
    expenseRatioBps: 57,  // 0.57%
  },
  {
    schemeCode:      '135001',
    schemeName:      'UTI Nifty 50 Index Fund — Direct Growth',
    amcName:         'UTI Mutual Fund',
    category:        'index',
    subCategory:     'large_cap',
    minSipPaise:     50000n, // ₹500
    // SEBI Riskometer: very_high (equity index)
    riskCategory:    'very_high',
    // No exit load on index funds
    exitLoadPct:     0,
    exitLoadDays:    0,
    expenseRatioBps: 18,  // 0.18%
  },
  {
    schemeCode:      '119598',
    schemeName:      'Axis ELSS Tax Saver Fund — Direct Growth',
    amcName:         'Axis Mutual Fund',
    category:        'elss',
    subCategory:     'large_cap',
    minSipPaise:     50000n, // ₹500
    // SEBI Riskometer: very_high (equity ELSS)
    riskCategory:    'very_high',
    // ELSS: 3-year statutory lock-in; exit load not applicable during lock-in
    exitLoadPct:     0,
    exitLoadDays:    0,
    expenseRatioBps: 70,  // 0.70%
  },
  {
    schemeCode:      '101206',
    schemeName:      'HDFC Liquid Fund — Direct Growth',
    amcName:         'HDFC Mutual Fund',
    category:        'liquid',
    subCategory:     null,
    minSipPaise:     500000n, // ₹5,000
    // SEBI Riskometer: low_to_moderate
    riskCategory:    'low_to_moderate',
    // Liquid funds: graded exit load (0.0070% day 1 → 0% after day 7)
    exitLoadPct:     1,    // 0.01% — represented as fraction of 100
    exitLoadDays:    7,
    expenseRatioBps: 20,  // 0.20%
  },
  {
    schemeCode:      '120586',
    schemeName:      'ICICI Prudential Balanced Advantage Fund — Direct Growth',
    amcName:         'ICICI Prudential Mutual Fund',
    category:        'hybrid',
    subCategory:     'balanced',
    minSipPaise:     50000n, // ₹500
    // SEBI Riskometer: moderately_high (BAF/dynamic asset allocation)
    riskCategory:    'moderately_high',
    // 1% exit load within 1 year
    exitLoadPct:     100,
    exitLoadDays:    365,
    expenseRatioBps: 76,  // 0.76%
  },
] as const;

type MfApiMeta = { scheme_name: string; fund_house: string };
type MfApiData = { date: string; nav: string }[];
type MfApiResponse = { meta: MfApiMeta; data: MfApiData };

/** Fetch latest NAV for a single scheme from mfapi.in. */
async function fetchNav(schemeCode: string): Promise<{ navPaise: bigint; navDate: string; schemeName: string; fundHouse: string } | null> {
  try {
    const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`, {
      next: { revalidate: 0 }, // never cache in Next.js fetch cache
    });
    if (!res.ok) {
      logger.warn({ schemeCode, status: res.status }, 'nav_fetch_failed');
      return null;
    }
    const json = await res.json() as MfApiResponse;
    const latest = json.data?.[0];
    if (!latest) {
      logger.warn({ schemeCode }, 'nav_fetch_empty');
      return null;
    }
    // NAV comes as "155.2345" — convert to paise (×100), round to 4 decimal paise
    const navPaise = BigInt(Math.round(parseFloat(latest.nav) * 100));
    return {
      navPaise,
      navDate:    latest.date,   // "22-05-2026" format from AMFI
      schemeName: json.meta?.scheme_name ?? '',
      fundHouse:  json.meta?.fund_house ?? '',
    };
  } catch (err) {
    logger.error({ schemeCode, err: (err as Error)?.message }, 'nav_fetch_exception');
    return null;
  }
}

export type NavSyncResult = {
  synced:  number;
  failed:  number;
  details: Array<{ schemeCode: string; navPaise?: string; navDate?: string; error?: string }>;
};

/**
 * Syncs NAVs for all curated funds. Upserts fund catalog rows on first run.
 * Safe to call multiple times — idempotent via schemeCode @unique.
 */
export async function syncNavs(): Promise<NavSyncResult> {
  const result: NavSyncResult = { synced: 0, failed: 0, details: [] };

  for (const fund of CURATED_FUNDS) {
    const nav = await fetchNav(fund.schemeCode);
    if (!nav) {
      result.failed++;
      result.details.push({ schemeCode: fund.schemeCode, error: 'fetch_failed' });
      continue;
    }

    try {
      await prisma.mutualFund.upsert({
        where:  { schemeCode: fund.schemeCode },
        create: {
          schemeCode:      fund.schemeCode,
          schemeName:      nav.schemeName || fund.schemeName,
          amcName:         nav.fundHouse  || fund.amcName,
          category:        fund.category,
          subCategory:     fund.subCategory ?? null,
          navPaise:        nav.navPaise,
          navDate:         nav.navDate,
          minSipPaise:     fund.minSipPaise,
          riskCategory:    fund.riskCategory,
          exitLoadPct:     fund.exitLoadPct,
          exitLoadDays:    fund.exitLoadDays,
          expenseRatioBps: fund.expenseRatioBps,
          isCurated:       true,
          isActive:        true,
        },
        update: {
          navPaise:        nav.navPaise,
          navDate:         nav.navDate,
          // Keep compliance fields current on each sync
          riskCategory:    fund.riskCategory,
          exitLoadPct:     fund.exitLoadPct,
          exitLoadDays:    fund.exitLoadDays,
          expenseRatioBps: fund.expenseRatioBps,
        },
      });

      result.synced++;
      result.details.push({ schemeCode: fund.schemeCode, navPaise: nav.navPaise.toString(), navDate: nav.navDate });
      logger.info({ schemeCode: fund.schemeCode, navPaise: nav.navPaise.toString(), navDate: nav.navDate }, 'nav_synced');

    } catch (err) {
      result.failed++;
      result.details.push({ schemeCode: fund.schemeCode, error: (err as Error)?.message });
      logger.error({ schemeCode: fund.schemeCode, err: (err as Error)?.message }, 'nav_upsert_failed');
    }
  }

  return result;
}

/**
 * After each nav-sync, update MFHolding.currentValuePaise for all users
 * so portfolio P&L is live without extra queries.
 */
export async function refreshHoldingValues(): Promise<void> {
  const funds = await prisma.mutualFund.findMany({
    where:   { isCurated: true, isActive: true },
    include: { holdings: true },
  });

  for (const fund of funds) {
    if (fund.navPaise === 0n) continue;
    for (const holding of fund.holdings) {
      if (holding.totalMicroUnits === 0n) continue;
      const currentValue = (holding.totalMicroUnits * fund.navPaise) / 1_000_000n;
      await prisma.mFHolding.update({
        where: { id: holding.id },
        data:  { currentValuePaise: currentValue, lastPricedAt: new Date() },
      });
    }
  }
}
