// GET /api/gold/price — returns live buy/sell gold price (60s Redis cache).
// Public to logged-in users; no KYC required to view price.

import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { getGoldPrice } from '@/lib/gold/price-cache';
import { logger } from '@/lib/logger';

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  try {
    const price = await getGoldPrice();
    return NextResponse.json({
      ok:               true,
      buyPaisePerGram:  price.buyPaisePerGram.toString(),
      sellPaisePerGram: price.sellPaisePerGram.toString(),
      // Human-readable rupee amounts for display
      buyRsPerGram:     (Number(price.buyPaisePerGram) / 100).toFixed(2),
      sellRsPerGram:    (Number(price.sellPaisePerGram) / 100).toFixed(2),
      fetchedAt:        price.fetchedAt,
    });
  } catch (err) {
    logger.error({ route: 'gold/price', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
