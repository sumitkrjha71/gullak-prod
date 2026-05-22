// KYC gate helper for API route handlers.
// Edge middleware can't query Postgres, so KYC enforcement happens here
// inside Node.js route handlers for sensitive operations.
//
// Usage:
//   const gate = await ensureKYC(session.userId);
//   if (gate) return gate; // returns 403 NextResponse if KYC incomplete

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function ensureKYC(userId: string): Promise<NextResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kycCompleted: true },
  });

  if (!user?.kycCompleted) {
    return NextResponse.json(
      { ok: false, error: 'kyc_required', redirectTo: '/kyc' },
      { status: 403 },
    );
  }

  return null; // KYC passed — caller continues normally
}
