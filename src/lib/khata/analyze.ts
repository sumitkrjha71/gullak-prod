// Financial Analysis Engine — the core intelligence.
// Consumes classified BankTransaction rows and produces:
//   IncomeSignal, CashflowSignal, BehavioralSignal, FinancialHealthScore
// All arithmetic in BigInt (paise). No floats in money paths.

import type {
  MonthlyAggregate, IncomeSignal, CashflowSignal, BehavioralSignal,
  FinancialHealthScore, HealthLabel, TxnCategory,
} from './types';

// ─── Monthly Aggregation ────────────────────────────────────────────────────

export function buildMonthlyAggregates(
  txns: { txnDate: Date; amountPaise: bigint; txnType: string; category: string }[],
): MonthlyAggregate[] {
  const byMonth = new Map<string, MonthlyAggregate>();

  for (const t of txns) {
    const monthKey = t.txnDate.toISOString().slice(0, 7);
    if (!byMonth.has(monthKey)) {
      byMonth.set(monthKey, {
        monthKey, creditPaise: 0n, debitPaise: 0n, surplusPaise: 0n,
        byCategory: {} as Record<TxnCategory, bigint>, txnCount: 0,
      });
    }
    const m = byMonth.get(monthKey)!;
    m.txnCount++;
    if (t.txnType === 'CREDIT') {
      m.creditPaise += t.amountPaise;
    } else {
      m.debitPaise += t.amountPaise;
      const cat = t.category as TxnCategory;
      m.byCategory[cat] = (m.byCategory[cat] ?? 0n) + t.amountPaise;
    }
  }

  // Calculate surplus per month
  for (const m of byMonth.values()) {
    m.surplusPaise = m.creditPaise - m.debitPaise;
  }

  return [...byMonth.values()].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

// ─── Income Detection ────────────────────────────────────────────────────────

export function detectIncome(
  txns: { txnDate: Date; amountPaise: bigint; txnType: string; category: string }[],
  months: MonthlyAggregate[],
): IncomeSignal {
  if (months.length === 0) {
    return { incomeType: 'unknown', avgMonthlyCreditPaise: 0n, salaryConsistencyPct: 0 };
  }

  const salaryTxns = txns.filter(t => t.txnType === 'CREDIT' && t.category === 'salary');
  const freelanceTxns = txns.filter(t => t.txnType === 'CREDIT' && t.category === 'freelance_income');
  const avgCredit = months.reduce((s, m) => s + m.creditPaise, 0n) / BigInt(months.length);

  // Salary detection: consistent credit in salary category
  if (salaryTxns.length >= 3) {
    // Group by month
    const salaryByMonth = new Map<string, bigint[]>();
    for (const t of salaryTxns) {
      const k = t.txnDate.toISOString().slice(0, 7);
      salaryByMonth.set(k, [...(salaryByMonth.get(k) ?? []), t.amountPaise]);
    }
    const monthsWithSalary = salaryByMonth.size;
    const consistencyPct = Math.round((monthsWithSalary / months.length) * 100);
    // Estimated salary = median of monthly max salary credits
    const monthSalaries = [...salaryByMonth.values()].map(v => v.reduce((a, b) => a > b ? a : b, 0n));
    monthSalaries.sort((a, b) => Number(a - b));
    const medianSalary = monthSalaries[Math.floor(monthSalaries.length / 2)] ?? 0n;
    // Salary day = mode of day-of-month for salary credits
    const days = salaryTxns.map(t => t.txnDate.getDate());
    const dayMode = modeOf(days);

    return {
      incomeType: 'salaried',
      avgMonthlyCreditPaise: avgCredit,
      salaryAmountPaise: medianSalary,
      salaryDay: dayMode,
      salaryConsistencyPct: consistencyPct,
    };
  }

  // Freelance detection
  if (freelanceTxns.length >= 2 || (salaryTxns.length === 0 && avgCredit > 1500000n)) {
    return { incomeType: 'freelance', avgMonthlyCreditPaise: avgCredit, salaryConsistencyPct: 40 };
  }

  return { incomeType: 'unknown', avgMonthlyCreditPaise: avgCredit, salaryConsistencyPct: 0 };
}

// ─── Cashflow Analysis ───────────────────────────────────────────────────────

export function analyzeCashflow(
  txns: { amountPaise: bigint; txnType: string; category: string; isRecurring: boolean }[],
  months: MonthlyAggregate[],
  income: IncomeSignal,
): CashflowSignal {
  if (months.length === 0) {
    return { avgMonthlySurplusPaise: 0n, surplusVolatilityScore: 50, cashflowStabilityScore: 50, debtIncomeRatioPct: 0, emiTotalPaise: 0n, emiCount: 0, subscriptionCount: 0, subscriptionTotalPaise: 0n, fixedExpensesPaise: 0n, variableExpensesPaise: 0n };
  }

  const surpluses = months.map(m => m.surplusPaise);
  const avgSurplus = surpluses.reduce((a, b) => a + b, 0n) / BigInt(surpluses.length);

  // Volatility: coefficient of variation of surplus
  const variance = surpluses.reduce((sum, s) => {
    const diff = Number(s - avgSurplus);
    return sum + diff * diff;
  }, 0) / surpluses.length;
  const stdDev = Math.sqrt(variance);
  const cv = avgSurplus > 0n ? stdDev / Number(avgSurplus) : 1;
  const volatilityScore = Math.max(0, Math.min(100, Math.round((1 - Math.min(cv, 1)) * 100)));

  // EMI analysis
  const emiTxns = txns.filter(t => t.category === 'emi');
  const emiByGroup = new Map<string, bigint>();
  for (const t of emiTxns.filter(t => t.txnType === 'DEBIT')) {
    emiByGroup.set('emi', (emiByGroup.get('emi') ?? 0n) + t.amountPaise);
  }
  const emiTotal = months.length > 0 ? (emiTxns.filter(t => t.txnType === 'DEBIT').reduce((s, t) => s + t.amountPaise, 0n) / BigInt(months.length)) : 0n;

  // Subscription analysis
  const subTxns = txns.filter(t => t.category === 'subscription' && t.txnType === 'DEBIT');
  const subGroups = new Set(subTxns.map(t => t.category));
  const subTotal = months.length > 0 ? (subTxns.reduce((s, t) => s + t.amountPaise, 0n) / BigInt(months.length)) : 0n;

  // Fixed vs variable
  const FIXED_CATS: TxnCategory[] = ['emi', 'rent', 'sip', 'insurance', 'subscription', 'utility'];
  const allDebits = txns.filter(t => t.txnType === 'DEBIT');
  const fixedTotal = months.length > 0 ? (allDebits.filter(t => FIXED_CATS.includes(t.category as TxnCategory)).reduce((s, t) => s + t.amountPaise, 0n) / BigInt(months.length)) : 0n;
  const variableTotal = months.length > 0 ? (allDebits.filter(t => !FIXED_CATS.includes(t.category as TxnCategory)).reduce((s, t) => s + t.amountPaise, 0n) / BigInt(months.length)) : 0n;

  // FOIR (Fixed Obligations to Income Ratio)
  const debtRatio = income.avgMonthlyCreditPaise > 0n
    ? Math.round(Number(emiTotal * 100n) / Number(income.avgMonthlyCreditPaise))
    : 0;

  // Composite stability: weighted avg of volatility score + FOIR penalty
  const foirPenalty = Math.min(debtRatio, 50);
  const stabilityScore = Math.max(0, Math.round(volatilityScore * 0.6 + (100 - foirPenalty * 1.5) * 0.4));

  return {
    avgMonthlySurplusPaise: avgSurplus,
    surplusVolatilityScore: volatilityScore,
    cashflowStabilityScore: stabilityScore,
    debtIncomeRatioPct: debtRatio,
    emiTotalPaise: emiTotal,
    emiCount: new Set(emiTxns.filter(t => t.isRecurring).length > 0 ? emiTxns : []).size,
    subscriptionCount: subGroups.size,
    subscriptionTotalPaise: subTotal,
    fixedExpensesPaise: fixedTotal,
    variableExpensesPaise: variableTotal,
  };
}

// ─── Behavioral Analysis ─────────────────────────────────────────────────────

export function analyzeBehavior(
  txns: { txnDate: Date; amountPaise: bigint; txnType: string; category: string }[],
  months: MonthlyAggregate[],
  gullakSavingsByMonth: Map<string, bigint>,
): BehavioralSignal {
  if (months.length === 0) {
    return { endOfMonthStressScore: 0, lifestyleInflationPct: 0, savingConsistencyPct: 0, impulsiveSpendingScore: 0 };
  }

  // End-of-month stress: high debit activity in last 5 days + low balance signal
  let stressMonths = 0;
  for (const m of months) {
    const [year, month] = m.monthKey.split('-').map(Number);
    const lastFiveDayStart = new Date(year, month - 1, 24); // day 24+
    const monthEnd = new Date(year, month, 0);              // last day
    const lateDebits = txns.filter(t =>
      t.txnType === 'DEBIT' && t.txnDate >= lastFiveDayStart && t.txnDate <= monthEnd,
    ).reduce((s, t) => s + t.amountPaise, 0n);
    // Stress if late debits > 30% of monthly debit total
    if (m.debitPaise > 0n && Number(lateDebits * 100n / m.debitPaise) > 30) stressMonths++;
  }
  const endOfMonthStressScore = Math.round((stressMonths / months.length) * 100);

  // Lifestyle inflation: compare variable spend in last 3 months vs 3 months before that
  const VARIABLE_CATS: TxnCategory[] = ['food', 'shopping', 'entertainment', 'travel', 'grocery'];
  const sortedMonths = [...months].sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  let lifestyleInflationPct = 0;
  if (sortedMonths.length >= 6) {
    const recent3 = sortedMonths.slice(-3);
    const prev3   = sortedMonths.slice(-6, -3);
    const varRecent = recent3.reduce((s, m) => s + VARIABLE_CATS.reduce((ss, cat) => ss + (m.byCategory[cat] ?? 0n), 0n), 0n) / 3n;
    const varPrev   = prev3.reduce((s, m)   => s + VARIABLE_CATS.reduce((ss, cat) => ss + (m.byCategory[cat] ?? 0n), 0n), 0n) / 3n;
    if (varPrev > 0n) lifestyleInflationPct = Math.round(Number((varRecent - varPrev) * 100n) / Number(varPrev));
  }

  // Saving consistency: months where user put money into Gullak
  const monthsWithSaving = [...gullakSavingsByMonth.values()].filter(v => v > 0n).length;
  const savingConsistencyPct = Math.round((monthsWithSaving / months.length) * 100);

  // Impulsive spending: late-night (10 PM–5 AM) + weekend food/shopping ratio
  const totalDebits = txns.filter(t => t.txnType === 'DEBIT').length;
  if (totalDebits > 0) {
    const impulsiveTxns = txns.filter(t => {
      if (t.txnType !== 'DEBIT') return false;
      const h = t.txnDate.getHours();
      const isLateNight = h >= 22 || h < 5;
      const dow = t.txnDate.getDay();
      const isWeekend = dow === 0 || dow === 6;
      const isImpulsiveCat = ['food', 'shopping', 'entertainment'].includes(t.category);
      return isLateNight || (isWeekend && isImpulsiveCat);
    }).length;
    var impulsiveSpendingScore = Math.min(100, Math.round((impulsiveTxns / totalDebits) * 200));
  } else {
    var impulsiveSpendingScore = 0;
  }

  return { endOfMonthStressScore, lifestyleInflationPct, savingConsistencyPct, impulsiveSpendingScore };
}

// ─── Financial Health Score ─────────────────────────────────────────────────

export function computeHealthScore(
  cashflow: CashflowSignal,
  behavioral: BehavioralSignal,
  income: IncomeSignal,
): FinancialHealthScore {
  // Weighted composite (higher = healthier)
  let score = 50;

  // Stability: +20 if cashflowStabilityScore is high
  score += Math.round((cashflow.cashflowStabilityScore - 50) * 0.4);

  // Debt: FOIR penalty (> 40% = danger)
  if (cashflow.debtIncomeRatioPct > 50) score -= 15;
  else if (cashflow.debtIncomeRatioPct > 40) score -= 8;
  else if (cashflow.debtIncomeRatioPct < 20) score += 5;

  // Behavioral
  score -= Math.round(behavioral.endOfMonthStressScore * 0.15);
  score += Math.round(behavioral.savingConsistencyPct * 0.10);
  if (behavioral.lifestyleInflationPct > 20) score -= 5;

  // Income stability
  if (income.incomeType === 'salaried' && income.salaryConsistencyPct >= 90) score += 8;
  if (income.incomeType === 'freelance') score -= 3;

  score = Math.max(0, Math.min(100, score));

  let label: HealthLabel;
  if (score < 30)      label = 'fragile';
  else if (score < 45) label = 'building';
  else if (score < 60) label = 'stable';
  else if (score < 75) label = 'growing';
  else                 label = 'thriving';

  return { score, label };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function modeOf(arr: number[]): number {
  const counts = new Map<number, number>();
  for (const v of arr) counts.set(v, (counts.get(v) ?? 0) + 1);
  let maxCount = 0, mode = arr[0] ?? 1;
  for (const [v, c] of counts) if (c > maxCount) { maxCount = c; mode = v; }
  return mode;
}
