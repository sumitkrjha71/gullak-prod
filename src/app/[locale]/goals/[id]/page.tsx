import Link from 'next/link';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { Users, ArrowRight } from 'lucide-react';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { progressPct, remainingPaise } from '@/lib/goals/math';
import { formatInr } from '@/lib/format/money';
import { ProgressRing } from '@/components/money/ProgressRing';
import { GoalBreakdown } from '@/components/money/GoalBreakdown';
import { Sparkline } from '@/components/money/Sparkline';
import { ActivityRow } from '../../activity/_activity-row';
import { StepHeader } from '@/components/flow/StepHeader';
import { computeEta } from '@/lib/format/eta';
import { GoalActions } from './_goal-actions';

export default async function GoalDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      transactions: { orderBy: { createdAt: 'desc' }, take: 30 },
      rules: { include: { mandate: true } },
    },
  });
  if (!goal || goal.userId !== session.userId) redirect(`/${locale}/home`);

  // Compute a 30-day saving velocity for ETA.
  const since = new Date(Date.now() - 30 * 86400000);
  const recent = goal.transactions.filter((t) => t.status === 'success' && t.createdAt > since);
  const dailyRatePaise = recent.length > 0
    ? Math.round(recent.reduce((s, x) => s + Number(x.amountPaise), 0) / 30)
    : 0;
  const eta = computeEta(remainingPaise(goal.savedPaise, goal.targetPaise), dailyRatePaise);

  // Sparkline values: cumulative saved by day for last ~30 days.
  const days = 30;
  const dayBuckets: number[] = Array.from({ length: days }, () => 0);
  for (const txn of goal.transactions) {
    if (txn.status !== 'success') continue;
    const ageDays = Math.floor((Date.now() - txn.createdAt.getTime()) / 86400000);
    if (ageDays < 0 || ageDays >= days) continue;
    dayBuckets[days - 1 - ageDays] += Number(txn.amountPaise);
  }
  const cumul: number[] = [];
  let acc = 0;
  for (const d of dayBuckets) {
    acc += d;
    cumul.push(acc);
  }

  const etaCopy =
    eta.complete
      ? '✓'
      : eta.unit === 'days'
        ? t('noSurprise.days', { count: eta.value })
        : eta.unit === 'weeks'
          ? t('noSurprise.weeks', { count: eta.value })
          : t('noSurprise.months', { count: eta.value });

  return (
    <main className="min-h-dvh bg-bg pb-20">
      <div className="safe-top mx-auto w-full max-w-md px-5 pt-3">
        <StepHeader />
      </div>
      <div className="mx-auto w-full max-w-md px-5">
        <h1 className="text-h2 font-semibold tracking-tight">{goal.title}</h1>

        <section className="mt-6 card p-5">
          <div className="flex items-center gap-5">
            <ProgressRing pct={progressPct(goal.savedPaise, goal.targetPaise)} size={104} stroke={9} />
            <div className="flex-1">
              <div className="text-[12px] uppercase tracking-wider text-muted">{t('goals.detail.totalSaved')}</div>
              <div className="mt-0.5 text-[28px] font-semibold tabular-nums">{formatInr(goal.savedPaise)}</div>
              <div className="mt-1 text-[12px] text-muted money">
                {t('goals.detail.remaining')}: {formatInr(remainingPaise(goal.savedPaise, goal.targetPaise))}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <GoalBreakdown
              saved={goal.savedPaise}
              invested={goal.investedPaise}
              munafa={goal.growthPaise}
              labels={{
                saved: t('goals.detail.totalSaved'),
                invested: t('goals.detail.invested'),
                munafa: t('goals.detail.munafa'),
              }}
            />
          </div>
          {!eta.complete && eta.value > 0 && (
            <p className="mt-4 text-[13px] text-muted">
              {t('goals.detail.etaPrefix')} {etaCopy} {t('goals.detail.etaSuffix')}
            </p>
          )}
        </section>

        <section className="mt-4 card p-5">
          <div className="text-[12px] uppercase tracking-wider text-muted">Trend</div>
          <div className="mt-3">
            <Sparkline values={cumul} width={300} height={64} />
          </div>
        </section>

        {/* Family Gullak entry — V5 M1 */}
        <Link
          href={`/${locale}/goals/${goal.id}/family`}
          className="haptic-press mt-4 flex items-center gap-3 px-4 py-3.5"
          style={{
            background: goal.isShared
              ? 'linear-gradient(145deg, #f0fdf9, #e6f7f4)'
              : 'linear-gradient(145deg, #FFF5EC, #FFE9D2)',
            border: `1.5px solid ${goal.isShared ? 'var(--trust)' : 'var(--saffron)'}`,
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
            style={{
              background: goal.isShared ? 'var(--trust)' : 'var(--saffron)',
              color: '#fff',
            }}
            aria-hidden
          >
            <Users size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-extrabold" style={{ color: 'var(--text)' }}>
              {goal.isShared ? 'Family Gullak' : 'Family ko bhi shamil karein'}
            </div>
            <div className="mt-0.5 text-[12px]" style={{ color: 'var(--muted)' }}>
              {goal.isShared
                ? 'Saathi ko dekhein, mil-jul ke kitna jod liya'
                : 'Mummy-papa ya partner ko bulao — mil-jul ke sapna pakka'}
            </div>
          </div>
          <ArrowRight size={16} style={{ color: goal.isShared ? 'var(--trust)' : 'var(--saffron)' }} aria-hidden />
        </Link>

        <GoalActions
          locale={locale}
          goalId={goal.id}
          ruleId={goal.rules[0]?.id ?? null}
          labels={{
            edit: t('goals.detail.edit'),
            pause: t('goals.detail.pause'),
            stop: t('goals.detail.stop'),
            pauseSheetTitle: t('goals.detail.pauseSheetTitle'),
            pauseSeven: t('goals.detail.pauseSeven'),
            pauseSalary: t('goals.detail.pauseSalary'),
            pauseIndefinite: t('goals.detail.pauseIndefinite'),
            stopConfirmTitle: t('goals.detail.stopConfirmTitle'),
            stopConfirmBody: t('goals.detail.stopConfirmBody'),
            confirm: t('common.confirm'),
            cancel: t('common.cancel'),
          }}
        />

        <section className="mt-6">
          <h3 className="mb-2 text-[12px] uppercase tracking-wider text-muted">{t('goals.detail.recentActivity')}</h3>
          <div className="grid gap-2">
            {goal.transactions.slice(0, 8).map((txn) => (
              <ActivityRow
                key={txn.id}
                amount={formatInr(txn.amountPaise)}
                source={t(`activity.row.${txn.source}` as never)}
                status={txn.status as 'success' | 'failed' | 'pending' | 'reversed'}
                goalTitle=""
                createdAt={txn.createdAt}
                failureKey={
                  txn.status === 'failed' && txn.failureReason
                    ? `activity.row.reason${txn.failureReason
                        .split('_')
                        .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
                        .join('')}`
                    : null
                }
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
