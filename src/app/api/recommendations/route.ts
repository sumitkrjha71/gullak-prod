import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

function serializeBigInts<T>(obj: T): unknown {
  return JSON.parse(JSON.stringify(obj, (_k, v) => typeof v === 'bigint' ? v.toString() : v));
}

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const recs = await prisma.autopilotRecommendation.findMany({
    where: {
      userId: session.userId,
      status: 'pending',
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    orderBy: [
      { confidenceScore: 'desc' },
      { createdAt: 'desc' },
    ],
    take: 10,
  });

  return NextResponse.json({ ok: true, recommendations: serializeBigInts(recs) });
}
