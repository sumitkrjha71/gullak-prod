import { redirect }          from 'next/navigation';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { readSession }       from '@/lib/auth/session';
import { prisma }            from '@/lib/db/client';
import { KhataView }         from './_khata-view';
import { BottomNav }         from '@/components/nav/BottomNav';
import type {
  KhataProfile, KhataInsight, KhataRec,
  KhataSnapshot, KhataBankAccount,
} from './_khata-view';

export const dynamic = 'force-dynamic';

/** Safely convert BigInt | null to string | null for client serialization */
function b(v: bigint | null | undefined): string | null {
  return v == null ? null : v.toString();
}

export default async function KhataPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  const userId = session.userId;

  // Parallel data fetch — all queries independent
  const [profile, rawInsights, rawTopRec, rawSnapshots, rawBankAccounts] = await Promise.all([

    prisma.userFinancialProfile.findUnique({ where: { userId } }),

    prisma.financialInsight.findMany({
      where: {
        userId,
        isDismissed: false,
        expiresAt:   { gt: new Date() },
      },
      orderBy: [
        // celebrate first (positive reinforcement), then warn, then info
        { severity: 'desc' },
        { isRead:   'asc'  },
        { createdAt:'desc' },
      ],
      take: 10,
    }),

    prisma.autopilotRecommendation.findFirst({
      where: {
        userId,
        status: 'pending',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { confidenceScore: 'desc' },
    }),

    prisma.cashflowSnapshot.findMany({
      where:   { userId },
      orderBy: { monthKey: 'desc' },
      take:    6,
    }),

    prisma.bankAccount.findMany({
      where:   { userId, isActive: true },
      include: { consent: { select: { fetchedAt: true, status: true } } },
    }),

  ]);

  // ── Serialize (BigInt → string) ──────────────────────────────────────────

  const serialProfile: KhataProfile | null = profile
    ? {
        financialHealthScore:   profile.financialHealthScore,
        financialHealthLabel:   profile.financialHealthLabel,
        detectedIncomeType:     profile.detectedIncomeType,
        avgMonthlyCreditPaise:  b(profile.avgMonthlyCreditPaise)  ?? '0',
        avgMonthlyDebitPaise:   b(profile.avgMonthlyDebitPaise)   ?? '0',
        avgMonthlySurplusPaise: b(profile.avgMonthlySurplusPaise) ?? '0',
        fixedExpensesPaise:     b(profile.fixedExpensesPaise)     ?? '0',
        variableExpensesPaise:  b(profile.variableExpensesPaise)  ?? '0',
        emiTotalPaise:          b(profile.emiTotalPaise)          ?? '0',
        emiCount:               profile.emiCount,
        subscriptionCount:      profile.subscriptionCount,
        subscriptionTotalPaise: b(profile.subscriptionTotalPaise) ?? '0',
        debtIncomeRatioPct:     profile.debtIncomeRatioPct,
        savingConsistencyPct:   profile.savingConsistencyPct,
        salaryDay:              profile.salaryDay,
        txnMonthsCovered:       profile.txnMonthsCovered,
        dataAsOf:               profile.dataAsOf?.toISOString() ?? null,
        recommendedSavePaise:   b(profile.recommendedSavePaise),
      }
    : null;

  const serialInsights: KhataInsight[] = rawInsights.map(i => ({
    id:             i.id,
    insightType:    i.insightType,
    severity:       i.severity,
    title:          i.title,
    body:           i.body,
    supportingData: i.supportingData,
    actionType:     i.actionType,
    isRead:         i.isRead,
  }));

  const serialTopRec: KhataRec | null = rawTopRec
    ? {
        id:                  rawTopRec.id,
        recType:             rawTopRec.recType,
        currentValuePaise:   b(rawTopRec.currentValuePaise),
        suggestedValuePaise: b(rawTopRec.suggestedValuePaise),
        reasoning:           rawTopRec.reasoning,
        confidenceScore:     rawTopRec.confidenceScore,
      }
    : null;

  const serialSnapshots: KhataSnapshot[] = rawSnapshots.map(s => ({
    monthKey:      s.monthKey,
    creditPaise:   b(s.creditPaise)  ?? '0',
    debitPaise:    b(s.debitPaise)   ?? '0',
    surplusPaise:  b(s.surplusPaise) ?? '0',
    topCategories: s.topCategories,
    savingsPaise:  b(s.savingsPaise) ?? '0',
  }));

  const serialBankAccounts: KhataBankAccount[] = rawBankAccounts.map(a => ({
    id:            a.id,
    fipId:         a.fipId,
    accountMasked: a.accountMasked,
    accountType:   a.accountType,
    fetchedAt:     a.consent.fetchedAt?.toISOString() ?? null,
  }));

  return (
    <>
      <KhataView
        locale={locale}
        profile={serialProfile}
        insights={serialInsights}
        topRec={serialTopRec}
        snapshots={serialSnapshots}
        bankAccounts={serialBankAccounts}
      />
      <BottomNav
        locale={locale}
        active="khata"
        labels={{
          home:      t('dash.navHome'),
          goals:     t('dash.navGoals'),
          khata:     t('dash.navKhata'),
          portfolio: t('dash.navPortfolio'),
          profile:   t('dash.navProfile'),
        }}
      />
    </>
  );
}
