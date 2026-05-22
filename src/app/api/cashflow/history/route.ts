import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

function serializeBigInts<T>(obj: T): unknown {
  return JSON.parse(JSON.stringify(obj, (_k, v) => typeof v === 'bigint' ? v.toString() : v));
}

export async function GET(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const months = Math.min(parseInt(searchParams.get('months') ?? '12', 10), 24);

  const snapshots = await prisma.cashflowSnapshot.findMany({
    where:   { userId: session.userId },
    orderBy: { monthKey: 'desc' },
    take:    months,
  });

  // Return in chronological order for charting
  snapshots.sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  return NextResponse.json({ ok: true, snapshots: serializeBigInts(snapshots) });
}
