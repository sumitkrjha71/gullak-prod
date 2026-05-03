import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { formatInr } from '@/lib/format/money';
import { progressPct } from '@/lib/goals/math';
import { StepHeader } from '@/components/flow/StepHeader';
import { PostActionTrust } from '@/components/trust/PostActionTrust';
import { GrowthChip } from '@/components/money/GrowthChip';
import { EmptyState } from '@/components/patterns/EmptyState';
import { NoSurpriseRow } from '@/components/trust/NoSurpriseRow';

export default async function WeeklySummaryPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  const since = new Date(Date.now() - 7 * 86400000);
  const txns = await prisma.transaction.findMany({
    where: { userId: session.userId, status: 'success', createdAt: { gte: since } },
  });
  const totalSavedPaise = txns.reduce((s, t) => s + Number(t.amountPaise), 0);

  const primaryGoal = await prisma.goal.findFirst({
    where: { userId: session.userId, status: 'active' },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });

  const growthThisWeek = txns.length > 0 ? Math.floor(totalSavedPaise * 0.0002 * 7) : 0;

  const activeRule = await prisma.autopilotRule.findFirst({
    where: { userId: session.userId, status: 'active' },
  });

  return (
    <main className="min-h-dvh bg-bg pb-20">
      <div className="safe-top mx-auto w-full max-w-md px-5 pt-3">
        <StepHeader />
      </div>
      <div className="mx-auto w-full max-w-md px-5">
        <h1 className="text-h2 font-semibold tracking-tight">{t('summary.weekly.title')}</h1>
        <p className="mt-1 text-[14px] text-muted">{t('summary.weekly.sub')}</p>

        {txns.length === 0 ? (
          <div className="mt-6">
            <EmptyState title={t('summary.weekly.empty.title')} body={t('summary.weekly.empty.sub')} />
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            <div className="card p-5">
              <div className="text-[12px] uppercase tracking-wider text-muted">{t('summary.weekly.savedThisWeek')}</div>
              <div className="mt-1 text-[32px] font-semibold tabular-nums">{formatInr(totalSavedPaise)}</div>
            </div>
            <div className="card p-5">
              <div className="text-[12px] uppercase tracking-wider text-muted">{t('summary.weekly.grewBy')}</div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-[32px] font-semibold tabular-nums text-growth">{formatInr(growthThisWeek)}</span>
                <GrowthChip paise={growthThisWeek} />
              </div>
            </div>
            {primaryGoal && (
              <div className="card p-5">
                <div className="text-[12px] uppercase tracking-wider text-muted">{primaryGoal.title}</div>
                <div className="mt-1 text-[20px] font-semibold tabular-nums">
                  {progressPct(primaryGoal.savedPaise, primaryGoal.targetPaise)}%
                </div>
              </div>
            )}
            {activeRule?.amountPaise && (
              <NoSurpriseRow when={t('noSurprise.tomorrow9am')} amount={formatInr(activeRule.amountPaise)} />
            )}
            <PostActionTrust>{t('summary.weekly.footer')}</PostActionTrust>
          </div>
        )}
      </div>
    </main>
  );
}
