import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { dispatch } from '@/lib/events/bus';

export async function GET(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const since = new Date(Date.now() - 7 * 86400000);
  const users = await prisma.user.findMany({ select: { id: true } });
  const summaries: { userId: string; savedPaise: number; growthPaise: number }[] = [];
  for (const u of users) {
    const txns = await prisma.transaction.findMany({
      where: { userId: u.id, status: 'success', createdAt: { gte: since } },
    });
    const saved = txns.reduce((s, t) => s + Number(t.amountPaise), 0);
    const growth = Math.floor(saved * 0.0002 * 7);
    if (saved > 0) {
      await dispatch({
        userId: u.id,
        type: 'WEEKLY_SUMMARY_GENERATED',
        payload: { savedPaise: saved, growthPaise: growth },
      });
      summaries.push({ userId: u.id, savedPaise: saved, growthPaise: growth });
    }
  }
  return NextResponse.json({ ok: true, generated: summaries.length });
}
