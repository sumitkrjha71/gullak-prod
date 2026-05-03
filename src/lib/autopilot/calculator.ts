/**
 * Smart Daily Save Calculator
 *
 * Solves: how much do I need to save every day, starting today, to reach
 *   `targetPaise` by `deadlineDate`, given expected post-tax compound returns?
 *
 * Math (annuity-due of monthly contributions invested at monthly rate r):
 *
 *   targetPaise = P × [((1 + r)^n − 1) / r] × (1 + r)
 *
 * where n = whole months until deadline, P = monthly contribution.
 * Solving for P:
 *
 *   P = targetPaise × r / [(1 + r)^n − 1] / (1 + r)
 *
 * If deadline is "soon" (< 3 months) we degrade to plain division — compounding
 * doesn't matter at that horizon.
 *
 * `gapPaise` is non-zero only when even at 5× the user's currently-feasible pace
 * (a soft proxy for "very tight"), the goal still won't fit. UI surfaces this as
 * a calm credit-bridge suggestion — never a red error.
 */

export type SavingsPlanInput = {
  targetPaise: number;
  deadlineDate: Date | string;
  /** Pre-tax annual return % (default 7%). */
  expectedReturnPct?: number;
  /** Marginal tax bracket on returns (default 10%). */
  taxBracketPct?: number;
};

export type SavingsPlan = {
  /** Months between today and deadline (whole). */
  months: number;
  /** Monthly contribution required (paise). */
  monthlyPaise: number;
  /** Daily contribution required (paise). */
  dailyPaise: number;
  /** Sum of all contributions (paise). */
  totalContrib: number;
  /** Projected corpus at deadline including munafa (paise). */
  projectedCorpus: number;
  /** Munafa (interest earned over total contributions, paise). */
  munafaPaise: number;
  /** Effective post-tax monthly rate, decimal. */
  monthlyRate: number;
  /** True when timeline is unreachable at any reasonable pace. */
  recommendCredit: boolean;
};

export function computeSavingsPlan(input: SavingsPlanInput): SavingsPlan {
  const target = Math.max(0, Math.round(input.targetPaise));
  const today = new Date();
  const deadline = input.deadlineDate instanceof Date ? input.deadlineDate : new Date(input.deadlineDate);
  const monthsRaw =
    (deadline.getFullYear() - today.getFullYear()) * 12 +
    (deadline.getMonth() - today.getMonth());
  const months = Math.max(1, monthsRaw);

  const annualPretax = (input.expectedReturnPct ?? 7) / 100;
  const tax = (input.taxBracketPct ?? 10) / 100;
  const annualPostTax = annualPretax * (1 - tax);
  const monthlyRate = annualPostTax / 12;

  let monthly: number;
  if (months <= 3 || monthlyRate < 1e-9) {
    // Compounding negligible — divide.
    monthly = target / months;
  } else {
    const factor = (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate;
    monthly = target / (factor * (1 + monthlyRate));
  }
  monthly = Math.max(0, Math.round(monthly));
  const daily = Math.max(0, Math.round(monthly / 30));

  const totalContrib = monthly * months;
  const projectedCorpus = target;
  const munafaPaise = Math.max(0, projectedCorpus - totalContrib);

  // Soft "too tight" check — daily would exceed ₹2000 = 2_00_000 paise
  const recommendCredit = daily > 2_00_000 && months < 24;

  return {
    months,
    monthlyPaise: monthly,
    dailyPaise: daily,
    totalContrib,
    projectedCorpus,
    munafaPaise,
    monthlyRate,
    recommendCredit,
  };
}

/**
 * Project a fixed daily contribution forward N years using the same return model.
 * Used by Success-page 5-year card and Daily-Spend Slider.
 */
export function projectCorpus(
  dailyPaise: number,
  years: number,
  expectedReturnPct = 7,
  taxBracketPct = 10,
): number {
  const months = years * 12;
  const monthly = dailyPaise * 30;
  const r = ((expectedReturnPct / 100) * (1 - taxBracketPct / 100)) / 12;
  if (r < 1e-9) return monthly * months;
  const factor = (Math.pow(1 + r, months) - 1) / r;
  return Math.round(monthly * factor * (1 + r));
}

/**
 * Three plan tiers — comfortable / aggressive / relaxed.
 * Used by the commitment screen so users see options instead of guessing.
 */
export function planTiers(input: SavingsPlanInput): {
  comfortable: SavingsPlan;
  aggressive: SavingsPlan;
  relaxed: SavingsPlan;
} {
  const comfortable = computeSavingsPlan(input);
  const deadline =
    input.deadlineDate instanceof Date ? input.deadlineDate : new Date(input.deadlineDate);

  // Aggressive: same target, 75% of comfortable's months — reaches earlier
  const aggressiveMonths = Math.max(2, Math.round(comfortable.months * 0.75));
  const aggDeadline = new Date(deadline);
  aggDeadline.setMonth(aggDeadline.getMonth() - (comfortable.months - aggressiveMonths));
  const aggressive = computeSavingsPlan({ ...input, deadlineDate: aggDeadline });

  // Relaxed: extends deadline by 30%
  const relaxedMonths = Math.round(comfortable.months * 1.3);
  const relDeadline = new Date(deadline);
  relDeadline.setMonth(relDeadline.getMonth() + (relaxedMonths - comfortable.months));
  const relaxed = computeSavingsPlan({ ...input, deadlineDate: relDeadline });

  return { comfortable, aggressive, relaxed };
}
