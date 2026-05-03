// Credit eligibility — gates the credit module behind savings discipline + AA data.
// Master prompt rule: do NOT push credit before 30 days of saving.

import { prisma } from '@/lib/db/client';
import { fetchAccountData, getActiveConsent, type AAAccountSnapshot } from '@/lib/aa';
import type { LoanProductType } from '@/lib/ocen';

export type EligibilityResult = {
  eligible: boolean;
  daysSinceFirstSave: number;
  hasActiveMandate: boolean;
  hasAAConsent: boolean;
  reason?: 'needs_30_days' | 'no_active_mandate' | 'no_aa_consent' | 'ok';
  /** Per-product max eligible principal in paise. */
  products: Array<{
    type: LoanProductType;
    maxPaise: number;
    indicativeRatePctBps: number;
  }>;
  snapshot: AAAccountSnapshot | null;
};

/** Evaluate user eligibility for the credit cross-sell. */
export async function evaluateUser(userId: string): Promise<EligibilityResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      transactions: { where: { status: 'success' }, orderBy: { createdAt: 'asc' }, take: 1 },
      mandates: { where: { revokedAt: null }, take: 1 },
    },
  });
  if (!user) {
    return { eligible: false, daysSinceFirstSave: 0, hasActiveMandate: false, hasAAConsent: false, products: [], snapshot: null };
  }

  const firstSaveAt = user.transactions[0]?.createdAt ?? null;
  const daysSinceFirstSave = firstSaveAt
    ? Math.floor((Date.now() - firstSaveAt.getTime()) / 86400000)
    : 0;
  const hasActiveMandate = user.mandates.length > 0;

  const consent = await getActiveConsent(userId);
  const hasAAConsent = !!consent;
  const snapshot = consent ? await fetchAccountData(consent.consentHandle) : null;

  if (daysSinceFirstSave < 30) {
    return { eligible: false, daysSinceFirstSave, hasActiveMandate, hasAAConsent, reason: 'needs_30_days', products: [], snapshot };
  }
  if (!hasActiveMandate) {
    return { eligible: false, daysSinceFirstSave, hasActiveMandate, hasAAConsent, reason: 'no_active_mandate', products: [], snapshot };
  }

  // Compute per-product limits from AA snapshot (or conservative defaults if no consent).
  const monthlyInflow = snapshot?.monthlyInflowPaise ?? 3_000_000; // ₹30K default
  const products: EligibilityResult['products'] = [
    {
      type: 'two-wheeler',
      maxPaise: Math.min(2_50_000_00, Math.round(monthlyInflow * 6)),
      indicativeRatePctBps: snapshot?.salaryDetected ? 1300 : 1500,
    },
    {
      type: 'four-wheeler',
      maxPaise: Math.min(8_00_000_00, Math.round(monthlyInflow * 12)),
      indicativeRatePctBps: snapshot?.salaryDetected ? 1050 : 1200,
    },
    {
      type: 'gold',
      maxPaise: Math.min(3_00_000_00, Math.round((snapshot?.averageBalancePaise ?? monthlyInflow) * 4)),
      indicativeRatePctBps: 950,
    },
    {
      type: 'consumer-durable',
      maxPaise: Math.min(50_000_00, Math.round(monthlyInflow * 1.5)),
      indicativeRatePctBps: snapshot?.salaryDetected ? 1500 : 1700,
    },
    {
      type: 'emergency',
      maxPaise: Math.min(1_00_000_00, Math.round(monthlyInflow * 2)),
      indicativeRatePctBps: 1700,
    },
  ];

  return {
    eligible: true,
    daysSinceFirstSave,
    hasActiveMandate,
    hasAAConsent,
    reason: 'ok',
    products,
    snapshot,
  };
}
