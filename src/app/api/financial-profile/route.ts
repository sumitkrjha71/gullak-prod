import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

function serializeBigInts<T>(obj: T): unknown {
  return JSON.parse(JSON.stringify(obj, (_k, v) => typeof v === 'bigint' ? v.toString() : v));
}

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const [profile, recentSnapshots] = await Promise.all([
    prisma.userFinancialProfile.findUnique({ where: { userId: session.userId } }),
    prisma.cashflowSnapshot.findMany({
      where:   { userId: session.userId },
      orderBy: { monthKey: 'desc' },
      take:    12,
    }),
  ]);

  if (!profile) {
    return NextResponse.json({ ok: true, linked: false });
  }

  return NextResponse.json({
    ok: true,
    linked: true,
    profile:   serializeBigInts(profile),
    snapshots: serializeBigInts(recentSnapshots),
  });
}
