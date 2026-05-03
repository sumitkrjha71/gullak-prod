import { NextRequest, NextResponse } from 'next/server';
import { runSalarySweepCron } from '@/lib/rules/engine';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const result = await runSalarySweepCron();
  return NextResponse.json({ ok: true, result });
}
