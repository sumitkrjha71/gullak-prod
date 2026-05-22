// Financial Insight generator — Bharat-voice, explainable, non-judgmental.
// Creates FinancialInsight rows after every profile rebuild.
// Each insight has a type, severity, Hinglish title+body, and supportingData for
// the "Kyun?" (Why?) tap on the card.

import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import { emit } from '@/lib/events/bus';
import type { UserFinancialProfile } from '@prisma/client';

const INSIGHT_TTL_DAYS = 30;

interface InsightSpec {
  insightType:    string;
  severity:       'info' | 'warn' | 'celebrate';
  title:          string;
  body:           string;
  supportingData: Record<string, unknown>;
  actionType?:    string;
  actionPayload?: Record<string, unknown>;
}

function inr(paise: bigint): string {
  const rupees = Number(paise) / 100;
  if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
  if (rupees >= 1000)   return `₹${(rupees / 1000).toFixed(1)}K`;
  return `₹${rupees.toFixed(0)}`;
}

export async function generateInsights(userId: string): Promise<void> {
  const profile = await prisma.userFinancialProfile.findUnique({ where: { userId } });
  if (!profile) {
    logger.warn({ userId }, 'generate_insights_no_profile');
    return;
  }

  const specs = buildInsightSpecs(profile);
  const expiresAt = new Date(Date.now() + INSIGHT_TTL_DAYS * 86400000);

  let created = 0;
  for (const spec of specs) {
    // Dedup: skip if same insightType already exists and is not dismissed
    const existing = await prisma.financialInsight.findFirst({
      where: { userId, insightType: spec.insightType, isDismissed: false, expiresAt: { gt: new Date() } },
    });
    if (existing) continue;

    const insight = await prisma.financialInsight.create({
      data: {
        userId,
        insightType:    spec.insightType,
        severity:       spec.severity,
        title:          spec.title,
        body:           spec.body,
        supportingData: JSON.stringify(spec.supportingData),
        actionType:     spec.actionType ?? null,
        actionPayload:  spec.actionPayload ? JSON.stringify(spec.actionPayload) : null,
        expiresAt,
      },
    });
    await emit({ type: 'INSIGHT_CREATED', userId, insightId: insight.id });
    created++;
  }

  logger.info({ userId, created, total: specs.length }, 'insights_generated');
}

function buildInsightSpecs(p: UserFinancialProfile): InsightSpec[] {
  const specs: InsightSpec[] = [];

  // ── 1. Surplus available ───────────────────────────────────────────────────
  if (p.avgMonthlySurplusPaise > 0n && p.recommendedSavePaise && p.recommendedSavePaise > 0n) {
    specs.push({
      insightType: 'surplus_available',
      severity:    'info',
      title:       `${inr(p.avgMonthlySurplusPaise)} bacha raha hai har mahine!`,
      body:        `Tera average monthly surplus dekha — ${inr(p.avgMonthlySurplusPaise)} free hai. Isme se sirf ${inr(p.recommendedSavePaise)} lagao Gullak mein, aur baaki enjoy karo tension-free.`,
      supportingData: {
        avgMonthlySurplusPaise:  p.avgMonthlySurplusPaise.toString(),
        recommendedSavePaise:    p.recommendedSavePaise.toString(),
        cashflowStabilityScore:  p.cashflowStabilityScore,
      },
      actionType:    'save_now',
      actionPayload: { amountPaise: p.recommendedSavePaise.toString() },
    });
  }

  // ── 2. End-of-month stress ─────────────────────────────────────────────────
  if (p.endOfMonthStressScore >= 50) {
    specs.push({
      insightType: 'end_of_month_stress',
      severity:    'warn',
      title:       'Month-end mein paisa tight ho jaata hai',
      body:        `Teri spending pattern se dikh raha hai ki mahine ke aakhri hafte mein kharcha zyada ho jaata hai. Ek chhota emergency buffer banana start karte hain — just ${inr(p.avgMonthlyCreditPaise / 20n)} se.`,
      supportingData: {
        endOfMonthStressScore: p.endOfMonthStressScore,
        avgMonthlyCreditPaise: p.avgMonthlyCreditPaise.toString(),
      },
      actionType:    'build_emergency',
      actionPayload: { targetPaise: (p.avgMonthlyCreditPaise / 20n).toString() },
    });
  }

  // ── 3. EMI pressure / FOIR ────────────────────────────────────────────────
  if (p.debtIncomeRatioPct > 40) {
    const danger = p.debtIncomeRatioPct > 50;
    specs.push({
      insightType: 'emi_pressure',
      severity:    'warn',
      title:       danger
        ? `EMI ${p.debtIncomeRatioPct}% income kha raha hai — yeh danger zone hai`
        : `EMI thoda high hai — ${p.debtIncomeRatioPct}% income ja raha hai`,
      body: danger
        ? `RBI ka safe limit 40% hai. Tera FOIR ${p.debtIncomeRatioPct}% hai. Koi naya loan lene se pehle ek baar sochna. Koi ek EMI preclosure kar sakte ho?`
        : `Teri ${p.emiCount} EMI mila ke ${inr(p.emiTotalPaise)} per month hai. Thoda manage karna padega — let's plan together.`,
      supportingData: {
        debtIncomeRatioPct: p.debtIncomeRatioPct,
        emiTotalPaise:      p.emiTotalPaise.toString(),
        emiCount:           p.emiCount,
        safeLimit:          40,
      },
    });
  }

  // ── 4. Lifestyle inflation ─────────────────────────────────────────────────
  if (p.lifestyleInflationPct > 20) {
    specs.push({
      insightType: 'lifestyle_inflation',
      severity:    'warn',
      title:       `Kharcha ${p.lifestyleInflationPct}% badh gaya pichle 3 mahine mein`,
      body:        `Food, shopping, aur entertainment mein spending recently badhi hai. Normal hai — life enjoy karo! But ek baar dekh lo kya kuch subscriptions band kar sakte ho.`,
      supportingData: {
        lifestyleInflationPct: p.lifestyleInflationPct,
        variableExpensesPaise: p.variableExpensesPaise.toString(),
      },
      actionType: 'view_spending',
    });
  }

  // ── 5. Saving streak / consistency ────────────────────────────────────────
  if (p.savingConsistencyPct >= 80) {
    specs.push({
      insightType: 'saving_streak',
      severity:    'celebrate',
      title:       'Wah! Regular saving chal rahi hai',
      body:        `${p.savingConsistencyPct}% mahino mein tune Gullak mein daala. Yeh habit hi asli wealth hai. Aise hi chalate raho!`,
      supportingData: {
        savingConsistencyPct: p.savingConsistencyPct,
      },
    });
  }

  // ── 6. Subscription overload ──────────────────────────────────────────────
  if (p.subscriptionCount >= 5) {
    specs.push({
      insightType: 'subscription_overload',
      severity:    'info',
      title:       `${p.subscriptionCount} subscriptions chal rahe hain — ${inr(p.subscriptionTotalPaise)}/month`,
      body:        `Netflix, Spotify, Adobe… check karo kitne actually use hote hain. Jo nahi use hota usse band karo — wahi paise Gullak mein daalo.`,
      supportingData: {
        subscriptionCount:      p.subscriptionCount,
        subscriptionTotalPaise: p.subscriptionTotalPaise.toString(),
      },
      actionType: 'view_spending',
    });
  }

  // ── 7. Emergency fund gap ─────────────────────────────────────────────────
  if (p.emergencyFundStatusPct < 50) {
    const targetPaise = p.avgMonthlyDebitPaise * 3n; // 3-month expenses target
    specs.push({
      insightType: 'emergency_fund_gap',
      severity:    p.emergencyFundStatusPct < 20 ? 'warn' : 'info',
      title:       'Emergency fund abhi kum hai',
      body:        `3 mahine ke kharche — ${inr(targetPaise)} — bachaa ke rakhna chahiye. Abhi ${p.emergencyFundStatusPct}% hi ready hai. Chota chota daal ke banate hain.`,
      supportingData: {
        emergencyFundStatusPct: p.emergencyFundStatusPct,
        targetPaise:            targetPaise.toString(),
        avgMonthlyDebitPaise:   p.avgMonthlyDebitPaise.toString(),
      },
      actionType:    'build_emergency',
      actionPayload: { targetPaise: targetPaise.toString() },
    });
  }

  // ── 8. Good month / thriving ──────────────────────────────────────────────
  if (p.financialHealthLabel === 'thriving' || p.financialHealthLabel === 'growing') {
    specs.push({
      insightType: 'good_month',
      severity:    'celebrate',
      title:       p.financialHealthLabel === 'thriving' ? 'Finance game on point hai!' : 'Teri financial health improve ho rahi hai',
      body:        p.financialHealthLabel === 'thriving'
        ? `Health score ${p.financialHealthScore}/100. Surplus, EMI control, savings — sab sahi hai. Ek SIP badhaane ka time aa gaya?`
        : `Score ${p.financialHealthScore}/100 — growing zone mein ho! Ek chhota step aur leke thriving mein pahunch jao.`,
      supportingData: {
        financialHealthScore: p.financialHealthScore,
        financialHealthLabel: p.financialHealthLabel,
      },
      actionType: 'increase_sip',
    });
  }

  // ── 9. Fragile state — need urgent action ────────────────────────────────
  if (p.financialHealthLabel === 'fragile') {
    specs.push({
      insightType: 'low_balance_risk',
      severity:    'warn',
      title:       'Thoda dhyan dena — finance tight dikh raha hai',
      body:        `Health score ${p.financialHealthScore}/100 hai abhi. Ek kaam karo — sirf ek step: koi ek subscription band karo ya ek month ke liye autopilot amount thoda kam karo.`,
      supportingData: {
        financialHealthScore:  p.financialHealthScore,
        debtIncomeRatioPct:    p.debtIncomeRatioPct,
        endOfMonthStressScore: p.endOfMonthStressScore,
      },
      actionType: 'reduce_sip',
    });
  }

  // ── 10. Impulsive spending nudge ──────────────────────────────────────────
  if (p.impulsiveSpendingScore >= 60) {
    specs.push({
      insightType: 'spending_spike',
      severity:    'info',
      title:       'Late-night aur weekend spending thodi zyada hai',
      body:        `Raat 10 baad aur weekend pe food/shopping orders kuch zyada ho rahe hain. Koi judgement nahi — bas ek tip: Swiggy order karne se pehle 5 min ruko. Surprisingly helpful hota hai!`,
      supportingData: {
        impulsiveSpendingScore: p.impulsiveSpendingScore,
      },
    });
  }

  // ── 11. Salaried — salary arrived nudge ───────────────────────────────────
  if (p.detectedIncomeType === 'salaried' && p.salaryDay) {
    const today = new Date();
    const daysUntilSalary = (() => {
      const thisMonth = new Date(today.getFullYear(), today.getMonth(), p.salaryDay);
      if (thisMonth > today) return Math.ceil((thisMonth.getTime() - today.getTime()) / 86400000);
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, p.salaryDay);
      return Math.ceil((nextMonth.getTime() - today.getTime()) / 86400000);
    })();

    if (daysUntilSalary <= 2) {
      specs.push({
        insightType: 'salary_arrived',
        severity:    'info',
        title:       'Salary aane wali hai — pehle save karo!',
        body:        `${p.salaryDay} tarikh ko salary expected hai. "Pay yourself first" — salary aate hi seedha ${inr(p.recommendedSavePaise ?? 0n)} Gullak mein daalo, phir baki sab.`,
        supportingData: {
          salaryDay:           p.salaryDay,
          daysUntilSalary,
          recommendedSavePaise: p.recommendedSavePaise?.toString(),
        },
        actionType:    'save_now',
        actionPayload: { amountPaise: p.recommendedSavePaise?.toString() },
      });
    }
  }

  // ── 12. Income irregular nudge ────────────────────────────────────────────
  if (p.detectedIncomeType === 'freelance' || (p.detectedIncomeType === 'unknown' && p.salaryConsistencyPct < 50)) {
    specs.push({
      insightType: 'income_irregular',
      severity:    'info',
      title:       'Income thoda irregular dikh raha hai',
      body:        `Har mahine same amount nahi aata — theek hai! Isliye fixed Autopilot ke saath variable bhi set karte hain. Good months mein zyada save karo, tight months mein adjust ho jaata hai.`,
      supportingData: {
        detectedIncomeType:   p.detectedIncomeType,
        salaryConsistencyPct: p.salaryConsistencyPct,
      },
    });
  }

  return specs;
}
