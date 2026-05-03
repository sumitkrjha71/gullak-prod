import { NextRequest, NextResponse } from 'next/server';
import { runDailySaveCron } from '@/lib/rules/engine';

export async function GET(req: NextRequest) {
  // Vercel Cron sends an Authorization header in production; locally we accept anything.
  const auth = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await runDailySaveCron();
  return NextResponse.json({ ok: true, result });
}
