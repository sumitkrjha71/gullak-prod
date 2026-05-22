import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { getConsentStatus } from '@/lib/kyc/consent';

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const [user, kycRecords, consents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { kycCompleted: true, panLast4: true, name: true, nomineeName: true, nomineeRelation: true },
    }),
    prisma.kYCRecord.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: { type: true, status: true, maskedIdentifier: true, verifiedAt: true },
    }),
    getConsentStatus(session.userId),
  ]);

  if (!user) return NextResponse.json({ ok: false, error: 'user_not_found' }, { status: 404 });

  return NextResponse.json({
    ok: true,
    kycCompleted: user.kycCompleted,
    panLast4: user.panLast4,
    name: user.name,
    nominee: user.nomineeName ? { name: user.nomineeName, relation: user.nomineeRelation } : null,
    records: kycRecords,
    consents,
  });
}
