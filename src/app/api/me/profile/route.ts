import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if (typeof body.name === 'string' || body.name === null) data.name = body.name;
  if (typeof body.locale === 'string') data.locale = body.locale;
  if (typeof body.ageRange === 'string' || body.ageRange === null) data.ageRange = body.ageRange;
  if (typeof body.incomeRange === 'string' || body.incomeRange === null) data.incomeRange = body.incomeRange;
  if (typeof body.state === 'string' || body.state === null) data.state = body.state;
  if (typeof body.salaryDay === 'number' || body.salaryDay === null) data.salaryDay = body.salaryDay;
  if (typeof body.isSalaried === 'boolean') data.isSalaried = body.isSalaried;

  await prisma.user.update({ where: { id: session.userId }, data });
  return NextResponse.json({ ok: true });
}
