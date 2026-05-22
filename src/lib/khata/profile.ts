// UserFinancialProfile builder — persists analysis results to DB.
// Called after every classification cycle. Upserts one row per user + appends
// CashflowSnapshot rows (@@unique on [userId, monthKey] so re-runs are idempotent).

import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';
import { emit } from '@/lib/events/bus';
import {
  buildMonthlyAggregates,
  detectIncome,
  analyzeCashflow,
  analyzeBehavior,
  computeHealthScore,
} from './analyze';
import type { TxnCategory } from './types';

interface BuildProfileInput {
  userId: string;
  /** ISO timestamps preserved; amountPaise comes from DB as bigint via Prisma */
  txns: {
    txnDate:     Date;
    amountPaise: bigint;
    txnType:     string;
    category:    string;
    isRecurring: boolean;
  }[];
  /** Gullak savings per month — sourced from Transaction table WHERE type='SAVE' */
  gullakSavingsByMonth: Map<string, bigint>;
}

export async function buildAndPersistProfile(input: BuildProfileInput): Promise<void> {
  const { userId, txns, gullakSavingsByMonth } = input;

  if (txns.length === 0) {
    logger.warn({ userId }, 'profile_build_skipped_no_txns');
    return;
  }

  const months   = buildMonthlyAggregates(txns);
  const income   = detectIncome(txns, months);
  const cashflow = analyzeCashflow(txns, months, income);
  const behavior = analyzeBehavior(txns, months, gullakSavingsByMonth);
  const health   = computeHealthScore(cashflow, behavior, income);

  // Derive autopilot signals
  // recommended save = 20% of surplus, floored at 0
  const recommendedSavePaise = cashflow.avgMonthlySurplusPaise > 0n
    ? cashflow.avgMonthlySurplusPaise / 5n
    : 0n;
  // max safe save = surplus minus a 10% buffer; must be ≥ 0
  const maxSafeSavePaise = cashflow.avgMonthlySurplusPaise > 0n
    ? (cashflow.avgMonthlySurplusPaise * 9n) / 10n
    : 0n;

  const avgDebit = months.reduce((s, m) => s + m.debitPaise, 0n) / BigInt(months.length);

  // Upsert profile
  await prisma.userFinancialProfile.upsert({
    where:  { userId },
    create: {
      userId,
      detectedIncomeType:     income.incomeType,
      avgMonthlyCreditPaise:  income.avgMonthlyCreditPaise,
      salaryAmountPaise:      income.salaryAmountPaise ?? null,
      salaryDay:              income.salaryDay ?? null,
      salaryConsistencyPct:   income.salaryConsistencyPct,
      avgMonthlyDebitPaise:   avgDebit,
      fixedExpensesPaise:     cashflow.fixedExpensesPaise,
      variableExpensesPaise:  cashflow.variableExpensesPaise,
      emiTotalPaise:          cashflow.emiTotalPaise,
      emiCount:               cashflow.emiCount,
      subscriptionCount:      cashflow.subscriptionCount,
      subscriptionTotalPaise: cashflow.subscriptionTotalPaise,
      avgMonthlySurplusPaise: cashflow.avgMonthlySurplusPaise,
      surplusVolatilityScore: cashflow.surplusVolatilityScore,
      cashflowStabilityScore: cashflow.cashflowStabilityScore,
      debtIncomeRatioPct:     cashflow.debtIncomeRatioPct,
      endOfMonthStressScore:  behavior.endOfMonthStressScore,
      lifestyleInflationPct:  behavior.lifestyleInflationPct,
      savingConsistencyPct:   behavior.savingConsistencyPct,
      impulsiveSpendingScore: behavior.impulsiveSpendingScore,
      financialHealthScore:   health.score,
      financialHealthLabel:   health.label,
      recommendedSavePaise,
      maxSafeSavePaise,
      txnMonthsCovered:       months.length,
      dataAsOf:               new Date(),
    },
    update: {
      detectedIncomeType:     income.incomeType,
      avgMonthlyCreditPaise:  income.avgMonthlyCreditPaise,
      salaryAmountPaise:      income.salaryAmountPaise ?? null,
      salaryDay:              income.salaryDay ?? null,
      salaryConsistencyPct:   income.salaryConsistencyPct,
      avgMonthlyDebitPaise:   avgDebit,
      fixedExpensesPaise:     cashflow.fixedExpensesPaise,
      variableExpensesPaise:  cashflow.variableExpensesPaise,
      emiTotalPaise:          cashflow.emiTotalPaise,
      emiCount:               cashflow.emiCount,
      subscriptionCount:      cashflow.subscriptionCount,
      subscriptionTotalPaise: cashflow.subscriptionTotalPaise,
      avgMonthlySurplusPaise: cashflow.avgMonthlySurplusPaise,
      surplusVolatilityScore: cashflow.surplusVolatilityScore,
      cashflowStabilityScore: cashflow.cashflowStabilityScore,
      debtIncomeRatioPct:     cashflow.debtIncomeRatioPct,
      endOfMonthStressScore:  behavior.endOfMonthStressScore,
      lifestyleInflationPct:  behavior.lifestyleInflationPct,
      savingConsistencyPct:   behavior.savingConsistencyPct,
      impulsiveSpendingScore: behavior.impulsiveSpendingScore,
      financialHealthScore:   health.score,
      financialHealthLabel:   health.label,
      recommendedSavePaise,
      maxSafeSavePaise,
      txnMonthsCovered:       months.length,
      dataAsOf:               new Date(),
    },
  });

  // Upsert CashflowSnapshot per month
  for (const m of months) {
    // Top 5 spending categories by paise
    const catEntries = Object.entries(m.byCategory) as [TxnCategory, bigint][];
    catEntries.sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : 0));
    const top5 = catEntries.slice(0, 5);
    const totalDebit = m.debitPaise > 0n ? m.debitPaise : 1n;
    const topCategories = JSON.stringify(
      top5.map(([cat, paise]) => ({
        category: cat,
        paise:    paise.toString(),
        pct:      Math.round(Number((paise * 100n) / totalDebit)),
      })),
    );

    const savingsPaise = gullakSavingsByMonth.get(m.monthKey) ?? 0n;

    await prisma.cashflowSnapshot.upsert({
      where:  { userId_monthKey: { userId, monthKey: m.monthKey } },
      create: {
        userId,
        monthKey:     m.monthKey,
        creditPaise:  m.creditPaise,
        debitPaise:   m.debitPaise,
        surplusPaise: m.surplusPaise,
        topCategories,
        savingsPaise,
        txnCount:     m.txnCount,
      },
      update: {
        creditPaise:  m.creditPaise,
        debitPaise:   m.debitPaise,
        surplusPaise: m.surplusPaise,
        topCategories,
        savingsPaise,
        txnCount:     m.txnCount,
      },
    });
  }

  await writeAudit({
    userId,
    eventType: 'AA_PROFILE_UPDATED',
    payload: {
      healthScore: health.score,
      healthLabel: health.label,
      months:      months.length,
      incomeType:  income.incomeType,
      foir:        cashflow.debtIncomeRatioPct,
    },
    source: 'system',
  });

  logger.info(
    { userId, healthScore: health.score, healthLabel: health.label, months: months.length },
    'financial_profile_built',
  );

  await emit({ type: 'PROFILE_UPDATED', userId });
}

/** Load the transactions and Gullak savings needed to build a profile, then build it. */
export async function rebuildProfileForUser(userId: string): Promise<void> {
  const [txns, gullakRows] = await Promise.all([
    prisma.bankTransaction.findMany({
      where: { userId },
      select: { txnDate: true, amountPaise: true, txnType: true, category: true, isRecurring: true },
      orderBy: { txnDate: 'asc' },
    }),
    // Gullak savings = all successful non-withdrawal transactions per month
    prisma.transaction.findMany({
      where:  { userId, status: 'success', source: { not: 'withdrawal' } },
      select: { createdAt: true, amountPaise: true },
    }),
  ]);

  // Group Gullak rows by YYYY-MM
  const gullakByMonth = new Map<string, bigint>();
  for (const row of gullakRows) {
    const k = row.createdAt.toISOString().slice(0, 7);
    gullakByMonth.set(k, (gullakByMonth.get(k) ?? 0n) + row.amountPaise);
  }

  await buildAndPersistProfile({ userId, txns, gullakSavingsByMonth: gullakByMonth });
}
