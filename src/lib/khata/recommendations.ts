// Recommendation engine — priority-stack, explainable, Bharat-voice.
// Priority order: Liquidity Safety → Debt Health → Income Stability
//                 → Cashflow Stability → Surplus Deployment → Celebration
// Every rec includes a reasoning field — always shown to user (no black boxes).

import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { emit } from '@/lib/events/bus';
import { writeAudit } from '@/lib/audit/log';
import type { UserFinancialProfile } from '@prisma/client';

function inr(paise: bigint | null | undefined): string {
  if (!paise) return '₹0';
  const rupees = Number(paise) / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000)   return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${rupees.toFixed(0)}`;
}

interface RecSpec {
  recType:             string;
  currentValuePaise?:  bigint;
  suggestedValuePaise?: bigint;
  reasoning:           string;
  confidenceScore:     number;
  actionPayload?:      Record<string, unknown>;
}

export async function generateRecommendations(userId: string): Promise<void> {
  const [profile, activeRule] = await Promise.all([
    prisma.userFinancialProfile.findUnique({ where: { userId } }),
    prisma.autopilotRule.findFirst({
      where:   { userId, status: 'active' },
      orderBy: { createdAt: 'desc' },
      select:  { amountPaise: true },
    }),
  ]);

  if (!profile) {
    logger.warn({ userId }, 'gen_recs_no_profile');
    return;
  }

  const specs = buildRecSpecs(profile, activeRule?.amountPaise ?? null);
  const expiresAt = new Date(Date.now() + 30 * 86400000);

  let created = 0;
  for (const spec of specs) {
    // Skip if same recType already pending
    const existing = await prisma.autopilotRecommendation.findFirst({
      where: { userId, recType: spec.recType, status: 'pending' },
    });
    if (existing) continue;

    const rec = await prisma.autopilotRecommendation.create({
      data: {
        userId,
        recType:             spec.recType,
        currentValuePaise:   spec.currentValuePaise ?? null,
        suggestedValuePaise: spec.suggestedValuePaise ?? null,
        reasoning:           spec.reasoning,
        confidenceScore:     spec.confidenceScore,
        status:              'pending',
        expiresAt,
      },
    });
    await emit({ type: 'RECOMMENDATION_CREATED', userId, recId: rec.id });
    created++;
  }

  logger.info({ userId, created }, 'recommendations_generated');
}

function buildRecSpecs(
  p: UserFinancialProfile,
  currentSavePaise: bigint | null,
): RecSpec[] {
  const specs: RecSpec[] = [];

  // ── Priority 1: Liquidity Safety ──────────────────────────────────────────
  if (p.emergencyFundStatusPct < 30) {
    const emergencyTargetPaise = p.avgMonthlyDebitPaise * 3n;
    const buildAmountPaise = p.avgMonthlySurplusPaise > 0n
      ? p.avgMonthlySurplusPaise / 4n  // 25% of surplus towards emergency
      : 0n;

    if (buildAmountPaise > 0n) {
      specs.push({
        recType:             'build_emergency_fund',
        suggestedValuePaise: buildAmountPaise,
        reasoning:           `Tera emergency fund sirf ${p.emergencyFundStatusPct}% ready hai. 3 mahine ke kharche ${inr(emergencyTargetPaise)} target hai. Hamesha "safety first" — isliye yeh sabse zaroori hai.`,
        confidenceScore:     90,
      });
    }
  }

  // ── Priority 2: Debt Health (FOIR) ────────────────────────────────────────
  if (p.debtIncomeRatioPct > 50) {
    // Pause autopilot if FOIR is critical — cash flow must stabilize first
    if (currentSavePaise && currentSavePaise > 0n) {
      specs.push({
        recType:             'pause_autopilot',
        currentValuePaise:   currentSavePaise,
        suggestedValuePaise: 0n,
        reasoning:           `FOIR ${p.debtIncomeRatioPct}% hai — yeh RBI safe limit (40%) se zyada hai. EMIs itni hain ki abhi saving hold karna smart move hai. EMI reduce hote hi resume karein.`,
        confidenceScore:     85,
      });
    }
  } else if (p.debtIncomeRatioPct > 40) {
    // Reduce save amount to ease cashflow
    const saferSavePaise = p.recommendedSavePaise
      ? (p.recommendedSavePaise * 6n) / 10n  // 60% of recommended
      : 0n;
    if (currentSavePaise && saferSavePaise > 0n && currentSavePaise > saferSavePaise) {
      specs.push({
        recType:             'adjust_save_amount',
        currentValuePaise:   currentSavePaise,
        suggestedValuePaise: saferSavePaise,
        reasoning:           `EMI load thoda zyada hai (FOIR ${p.debtIncomeRatioPct}%). Autopilot amount ${inr(currentSavePaise)} se ${inr(saferSavePaise)} kar dete hain — comfortable rahega, saving bhi chalti rahegi.`,
        confidenceScore:     80,
      });
    }
  }

  // ── Priority 3: Income Stability ──────────────────────────────────────────
  if (
    (p.detectedIncomeType === 'freelance' || p.detectedIncomeType === 'unknown') &&
    p.salaryConsistencyPct < 60
  ) {
    const variableSavePaise = p.avgMonthlySurplusPaise > 0n
      ? p.avgMonthlySurplusPaise / 5n
      : 0n;
    if (variableSavePaise > 0n) {
      specs.push({
        recType:             'adjust_save_amount',
        currentValuePaise:   currentSavePaise ?? 0n,
        suggestedValuePaise: variableSavePaise,
        reasoning:           `Income irregular hai — safe amount ${inr(variableSavePaise)}/month hai. Zyada lagaye toh tight months mein dikkat ho sakti hai.`,
        confidenceScore:     75,
      });
    }
  }

  // ── Priority 4: Cashflow Stability ────────────────────────────────────────
  if (p.cashflowStabilityScore < 40 && p.surplusVolatilityScore < 40) {
    // High volatility — suggest smaller but consistent saves
    const conservativePaise = p.avgMonthlySurplusPaise > 0n
      ? p.avgMonthlySurplusPaise / 10n  // 10% — very conservative
      : 0n;
    if (conservativePaise > 0n && (!currentSavePaise || currentSavePaise > conservativePaise * 2n)) {
      specs.push({
        recType:             'adjust_save_amount',
        currentValuePaise:   currentSavePaise ?? 0n,
        suggestedValuePaise: conservativePaise,
        reasoning:           `Teri monthly cashflow mein ${100 - p.surplusVolatilityScore}% volatility hai. Chhoti consistent saving better hai — ${inr(conservativePaise)}/month se start karo.`,
        confidenceScore:     72,
      });
    }
  }

  // ── Priority 5: Surplus Deployment ────────────────────────────────────────
  if (
    p.financialHealthLabel === 'growing' || p.financialHealthLabel === 'thriving'
  ) {
    const healthySurplusPaise = p.avgMonthlySurplusPaise;

    // If currently saving less than recommended
    if (
      p.recommendedSavePaise &&
      currentSavePaise &&
      currentSavePaise < p.recommendedSavePaise &&
      healthySurplusPaise > p.recommendedSavePaise
    ) {
      specs.push({
        recType:             'adjust_save_amount',
        currentValuePaise:   currentSavePaise,
        suggestedValuePaise: p.recommendedSavePaise,
        reasoning:           `Paisa achha aa raha hai — surplus strong hai. ${inr(currentSavePaise)} se ${inr(p.recommendedSavePaise)} kar sakte ho bina koi dikkat ke.`,
        confidenceScore:     82,
      });
    }

    // If no active SIP — suggest starting one
    if (p.emiCount === 0 || p.debtIncomeRatioPct < 20) {
      const sipSuggestPaise = healthySurplusPaise > 0n ? healthySurplusPaise / 6n : 0n;
      if (sipSuggestPaise > 500000n) { // > ₹5000
        specs.push({
          recType:             'start_sip',
          suggestedValuePaise: sipSuggestPaise,
          reasoning:           `Tera FOIR low hai aur surplus strong. ${inr(sipSuggestPaise)}/month ka SIP start karne ka best time hai — compounding ka fayda jitna jaldi utna zyada.`,
          confidenceScore:     78,
        });
      }
    }

    // Allocate surplus bonus months
    if (p.lifestyleInflationPct <= 5 && healthySurplusPaise > p.avgMonthlyDebitPaise / 2n) {
      specs.push({
        recType:             'allocate_surplus',
        suggestedValuePaise: healthySurplusPaise / 3n,
        reasoning:           `Bahut zyada surplus hai aur spending controlled hai. ${inr(healthySurplusPaise / 3n)} ek lump-sum invest karo — Gullak goal boost kar sakte ho.`,
        confidenceScore:     70,
      });
    }
  }

  // ── Priority 6: Celebration / Resume ──────────────────────────────────────
  if (p.financialHealthLabel === 'thriving' && p.savingConsistencyPct >= 80) {
    specs.push({
      recType:             'increase_sip',
      currentValuePaise:   currentSavePaise ?? 0n,
      suggestedValuePaise: currentSavePaise ? (currentSavePaise * 12n) / 10n : undefined, // +20%
      reasoning:           `Health score ${p.financialHealthScore}/100 — tum thriving ho! SIP 20% badhao — yeh salary hike jaisa hai future self ke liye.`,
      confidenceScore:     75,
    });
  }

  // De-duplicate by recType (keep first = highest priority)
  const seen = new Set<string>();
  return specs.filter(s => {
    if (seen.has(s.recType)) return false;
    seen.add(s.recType);
    return true;
  });
}

export async function applyRecommendationAction(
  userId: string,
  recId: string,
  action: 'accept' | 'reject' | 'snooze',
  snoozeDays?: number,
): Promise<void> {
  const rec = await prisma.autopilotRecommendation.findUnique({ where: { id: recId } });
  if (!rec || rec.userId !== userId) throw new Error('rec_not_found');
  if (rec.status !== 'pending') throw new Error('rec_not_actionable');

  const now = new Date();
  const updateData =
    action === 'accept'  ? { status: 'accepted',  acceptedAt: now } :
    action === 'reject'  ? { status: 'rejected',  rejectedAt: now } :
    /* snooze */           { status: 'snoozed',   snoozedUntil: new Date(now.getTime() + (snoozeDays ?? 7) * 86400000) };

  await prisma.autopilotRecommendation.update({ where: { id: recId }, data: updateData });

  const auditEvent =
    action === 'accept' ? 'RECOMMENDATION_ACCEPTED' :
    action === 'reject' ? 'RECOMMENDATION_REJECTED' :
                          'RECOMMENDATION_SNOOZED';

  await writeAudit({ userId, eventType: auditEvent, payload: { recId, recType: rec.recType }, source: 'user' });

  logger.info({ userId, recId, action, recType: rec.recType }, 'recommendation_actioned');
}
