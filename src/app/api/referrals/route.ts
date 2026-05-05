// V5 M9 — GET /api/referrals — fetch the user's referral code + stats.

import { NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { getOrCreateReferralCode, listMyReferrals } from '@/lib/referrals/codes';

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauth' }, { status: 401 });

  const code = await getOrCreateReferralCode(session.userId);
  const referrals = await listMyReferrals(session.userId);

  const totalEarnedPaise = referrals
    .filter((r) => r.status === 'REWARDED')
    .reduce((s, r) => s + Number(r.rewardPaise), 0);

  return NextResponse.json({
    ok: true,
    code,
    totalEarnedPaise,
    referrals: referrals.map((r) => ({
      id: r.id,
      code: r.code,
      status: r.status,
      rewardPaise: Number(r.rewardPaise),
      joinedAt: r.joinedAt?.toISOString() ?? null,
      rewardedAt: r.rewardedAt?.toISOString() ?? null,
      createdAt: r.createdAt.toISOString(),
    })),
  });
}
