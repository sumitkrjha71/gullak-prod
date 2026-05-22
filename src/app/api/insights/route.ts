import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

export async function GET(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const includeRead = searchParams.get('includeRead') === 'true';

  const insights = await prisma.financialInsight.findMany({
    where: {
      userId:      session.userId,
      isDismissed: false,
      ...(includeRead ? {} : {}), // always return all non-dismissed for now
      expiresAt:   { gt: new Date() },
    },
    orderBy: [
      { severity: 'desc' },  // warn first, then celebrate, then info
      { createdAt: 'desc' },
    ],
    take: 20,
  });

  // Mark as read in background (fire-and-forget)
  const unreadIds = insights.filter(i => !i.isRead).map(i => i.id);
  if (unreadIds.length > 0) {
    void prisma.financialInsight.updateMany({
      where: { id: { in: unreadIds } },
      data:  { isRead: true },
    });
  }

  return NextResponse.json({ ok: true, insights });
}
