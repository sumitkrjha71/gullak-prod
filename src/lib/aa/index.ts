// Mock Account Aggregator (Sahamati AA) layer.
// In V3 this is fully simulated. The surface mirrors what a real AA integration
// (e.g. Sahamati / Setu AA) would return, so swapping for production is contained.

import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';
import crypto from 'crypto';

export type AAAccountSnapshot = {
  bankName: string;
  accountMasked: string;
  monthlyInflowPaise: number;
  monthlyOutflowPaise: number;
  averageBalancePaise: number;
  salaryDetected: boolean;
  salaryDay: number | null;
  emiCount: number;
  emiTotalMonthlyPaise: number;
  txnCount6mo: number;
};

const MOCK_FIPS = [
  { id: 'MOCK_HDFC', name: 'HDFC Bank (mock)' },
  { id: 'MOCK_ICICI', name: 'ICICI Bank (mock)' },
  { id: 'MOCK_SBI', name: 'State Bank of India (mock)' },
];

export function listAvailableFips() {
  return MOCK_FIPS;
}

export async function linkConsent({
  userId,
  fipId,
}: {
  userId: string;
  fipId: string;
}): Promise<{ consentHandle: string }> {
  const consentHandle = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 365 * 86400000);
  const snapshot = generateMockSnapshot(userId, fipId);

  await prisma.$transaction([
    prisma.aAConsent.create({
      data: {
        userId,
        fipId,
        consentHandle,
        status: 'ACTIVE',
        fetchedAt: new Date(),
        expiresAt,
        payload: JSON.stringify(snapshot),
      },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { aaConsentLinkedAt: new Date() },
    }),
  ]);

  await writeAudit({
    userId,
    eventType: 'PREF_CHANGED',
    payload: { aaConsent: 'linked', fipId, consentHandle },
    source: 'user',
  });

  return { consentHandle };
}

export async function fetchAccountData(consentHandle: string): Promise<AAAccountSnapshot | null> {
  const c = await prisma.aAConsent.findUnique({ where: { consentHandle } });
  if (!c || c.status !== 'ACTIVE' || !c.payload) return null;
  try {
    return JSON.parse(c.payload) as AAAccountSnapshot;
  } catch {
    return null;
  }
}

export async function disconnectConsent(userId: string, consentHandle: string) {
  await prisma.aAConsent.update({
    where: { consentHandle },
    data: { status: 'REVOKED' },
  });
  await writeAudit({
    userId,
    eventType: 'PREF_CHANGED',
    payload: { aaConsent: 'revoked', consentHandle },
    source: 'user',
  });
}

export async function getActiveConsent(userId: string) {
  return prisma.aAConsent.findFirst({
    where: { userId, status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' },
  });
}

/** Deterministic mock account snapshot keyed by userId + fipId. */
function generateMockSnapshot(userId: string, fipId: string): AAAccountSnapshot {
  const seed = hashSeed(`${userId}|${fipId}`);
  const fip = MOCK_FIPS.find((f) => f.id === fipId) ?? MOCK_FIPS[0];

  // Deterministic-but-realistic synthetic values.
  const monthlyInflow = 4_000_000 + (seed % 6_000_000);              // ₹40K – ₹100K
  const monthlyOutflow = Math.round(monthlyInflow * (0.55 + ((seed >> 8) % 30) / 100)); // 55–85%
  const avgBalance = Math.round(monthlyInflow * 0.4);
  const emiCount = (seed >> 16) % 3; // 0–2 EMIs
  const emiTotal = emiCount > 0 ? monthlyInflow / 6 : 0;

  return {
    bankName: fip.name,
    accountMasked: `XXXX${String((seed % 10000)).padStart(4, '0')}`,
    monthlyInflowPaise: monthlyInflow,
    monthlyOutflowPaise: monthlyOutflow,
    averageBalancePaise: avgBalance,
    salaryDetected: monthlyInflow > 2_500_000, // > ₹25K
    salaryDay: monthlyInflow > 2_500_000 ? 1 + ((seed >> 4) % 28) : null,
    emiCount,
    emiTotalMonthlyPaise: Math.round(emiTotal),
    txnCount6mo: 60 + (seed % 240),
  };
}

function hashSeed(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
