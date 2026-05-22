// Cron: runs daily at 8 PM IST (14:30 UTC) — after AMFI publishes end-of-day NAVs.
// 1. Fetches latest NAV for all curated funds from mfapi.in
// 2. Updates MutualFund.navPaise in DB
// 3. Refreshes MFHolding.currentValuePaise for all users
// Also seeds the fund catalog on first deploy.

import { NextRequest, NextResponse } from 'next/server';
import { syncNavs, refreshHoldingValues } from '@/lib/mf/nav-sync';
import { logger } from '@/lib/logger';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const syncResult = await syncNavs();
    await refreshHoldingValues();

    logger.info({ synced: syncResult.synced, failed: syncResult.failed }, 'nav_sync_cron_complete');
    return NextResponse.json({ ok: true, result: syncResult });

  } catch (err) {
    logger.error({ route: 'cron/nav-sync', err: (err as Error)?.message }, 'nav_sync_failed');
    return NextResponse.json({ ok: false, error: 'nav_sync_failed' }, { status: 500 });
  }
}
