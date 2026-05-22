import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });

  const insight = await prisma.financialInsight.findUnique({ where: { id: params.id } });
  if (!insight || insight.userId !== session.userId) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  await prisma.financialInsight.update({
    where: { id: params.id },
    data:  { isDismissed: true, isRead: true },
  });

  return NextResponse.json({ ok: true });
}
