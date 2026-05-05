// V5 M10 — daily cron that refreshes the state-leaderboard snapshot for the current month.
// Called by Vercel Cron at 02:00 IST daily.

import { NextRequest, NextResponse } from 'next/server';
import { persistLeaderboardSnapshot } from '@/lib/leaderboard/aggregate';

export async function GET(_req: NextRequest) {
  try {
    const result = await persistLeaderboardSnapshot();
    return NextResponse.json({ ok: true, ...result, runAt: new Date().toISOString() });
  } catch (e) {
    console.error('[cron/leaderboard] failed:', e);
    return NextResponse.json({ ok: false, error: 'failed' }, { status: 500 });
  }
}
