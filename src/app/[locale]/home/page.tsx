import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { progressPct, remainingPaise } from '@/lib/goals/math';
import { evaluateUser } from '@/lib/credit/eligibility';
import { nextFestivalFor } from '@/lib/festivals/calendar';
import { Dashboard } from './_dashboard';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      goals: { where: { status: 'active' }, orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }] },
      rules: { where: { status: 'active' }, include: { goal: true } },
      transactions: { where: { status: { in: ['success', 'failed'] } }, orderBy: { createdAt: 'desc' }, take: 30, include: { goal: true } },
      streak: true,
    },
  });
  if (!user) redirect(`/${locale}`);

  const primary = user.goals[0] ?? null;
  const totalSaved = user.goals.reduce((s, g) => s + Number(g.savedPaise), 0);
  const totalGrowth = user.goals.reduce((s, g) => s + Number(g.growthPaise), 0);
  const dailyAmt = user.rules[0]?.amountPaise ? Math.round(Number(user.rules[0].amountPaise) / 100) : 20;

  // Build a 12-point chart series from cumulative daily totals.
  const days = 12;
  const buckets: number[] = Array.from({ length: days }, () => 0);
  for (const t of user.transactions) {
    if (t.status !== 'success') continue;
    const ageDays = Math.floor((Date.now() - t.createdAt.getTime()) / 86400000);
    if (ageDays < 0 || ageDays >= days) continue;
    buckets[days - 1 - ageDays] += Number(t.amountPaise);
  }
  const cumul: number[] = [];
  let acc = 0;
  for (const d of buckets) { acc += d; cumul.push(acc); }
  // Normalise for SVG path (0..100 range).
  const max = Math.max(...cumul, 1);
  const chartPoints = cumul.map((v) => Math.round((v / max) * 95));

  const goalProgress = primary ? progressPct(primary.savedPaise, primary.targetPaise) : 0;
  const goalRemaining = primary ? Math.round(remainingPaise(primary.savedPaise, primary.targetPaise) / 100) : 0;
  const monthsAtPace = primary && dailyAmt > 0
    ? Math.max(1, Math.ceil(remainingPaise(primary.savedPaise, primary.targetPaise) / 100 / (dailyAmt * 30)))
    : 0;

  const monthlyGrowth = totalGrowth ? Math.round(totalGrowth / 100) : 0;
  const streak = user.streak?.currentDays ?? 0;

  // V5 M6 — Festival nudge. State-keyed to user's saved state.
  const upcomingFestival = nextFestivalFor(user.state);

  // Credit eligibility — only show the credit card if eligible.
  const elig = await evaluateUser(user.id);
  const topProduct = elig.eligible
    ? elig.products.slice().sort((a, b) => b.maxPaise - a.maxPaise)[0]
    : null;
  const creditCard = topProduct
    ? {
        type: topProduct.type,
        maxRupees: Math.round(topProduct.maxPaise / 100),
        ratePct: (topProduct.indicativeRatePctBps / 100).toFixed(1),
      }
    : null;

  return (
    <Dashboard
      locale={locale}
      userName={user.name ?? 'User'}
      totalSavedRupees={Math.round(totalSaved / 100)}
      monthlyGrowthRupees={monthlyGrowth}
      streakDays={streak}
      dailyAmt={dailyAmt}
      chartPoints={chartPoints}
      primaryGoal={
        primary
          ? {
              id: primary.id,
              title: primary.title,
              type: primary.type,
              savedRupees: Math.round(Number(primary.savedPaise) / 100),
              targetRupees: Math.round(Number(primary.targetPaise) / 100),
              progressPct: goalProgress,
              remainingRupees: goalRemaining,
              etaMonths: monthsAtPace,
            }
          : null
      }
      creditCard={
        creditCard
          ? {
              type: creditCard.type,
              cta: t('credit.dashboardCta', { max: new Intl.NumberFormat('en-IN').format(creditCard.maxRupees) }),
              link: t('credit.dashboardLink'),
              ratePct: creditCard.ratePct,
            }
          : null
      }
      festival={
        upcomingFestival
          ? {
              id: upcomingFestival.festival.id,
              name: upcomingFestival.festival.name,
              emoji: upcomingFestival.festival.emoji,
              headline: upcomingFestival.festival.headline,
              sub: upcomingFestival.festival.sub,
              defaultTargetRupees: upcomingFestival.festival.defaultTargetRupees,
              daysAway: upcomingFestival.daysAway,
              states: upcomingFestival.festival.states,
              dates: upcomingFestival.festival.dates,
            }
          : null
      }
      recentTxns={user.transactions.slice(0, 3).map((tx) => ({
        id: tx.id,
        source: tx.source,
        status: tx.status,
        amountRupees: Math.round(Number(tx.amountPaise) / 100),
        createdAt: tx.createdAt.toISOString(),
      }))}
      labels={{
        appName: t('common.appName'),
        trust: t('dash.trust'),
        help: t('dash.help'),
        chartTitle: t('dash.chartTitle'),
        balance: t('dash.balance'),
        saved: t('dash.saved'),
        munafa: t('dash.munafa'),
        totalJama: t('dash.totalJama'),
        streak: streak > 0 ? t('dash.streak', { n: streak }) : '',
        munafaMonth: t('dash.munafaMonth'),
        munafaTag: t('dash.munafaTag'),
        goalEta: monthsAtPace ? t('dash.goalEta', { n: monthsAtPace }) : '',
        goalRemain: t('dash.goalRemain', { n: new Intl.NumberFormat('en-IN').format(goalRemaining) }),
        nextAction: t('dash.nextAction', { n: dailyAmt }),
        nextSub: t('dash.nextSub'),
        motivation: t('dash.motivation', { n: dailyAmt }),
        txTitle: t('dash.txTitle'),
        txMore: t('dash.txMore'),
        txDaily: t('dash.txDaily'),
        txRoundup: t('dash.txRoundup'),
        txFailed: t('dash.txFailed'),
        nudge: dailyAmt && monthsAtPace
          ? t('dash.nudge', { a: dailyAmt, b: dailyAmt * 2, n: Math.max(1, Math.ceil(monthsAtPace / 2)) })
          : '',
        nudgeCta: t('dash.nudgeCta'),
        tapToUnpack: t('dash.tapToUnpack'),
        navHome: t('dash.navHome'),
        navGoals: t('dash.navGoals'),
        navPortfolio: t('dash.navPortfolio'),
        navProfile: t('dash.navProfile'),
        emptyTitle: t('dash.empty.title'),
        emptySub: t('dash.empty.sub'),
        emptyCta: t('dash.empty.cta'),
        wt: {
          skip: t('walkthrough.skip'),
          next: t('walkthrough.next'),
          done: t('walkthrough.done'),
          step1Title: t('walkthrough.step1Title'),
          step1Body: t('walkthrough.step1Body'),
          step2Title: t('walkthrough.step2Title'),
          step2Body: t('walkthrough.step2Body'),
          step3Title: t('walkthrough.step3Title'),
          step3Body: t('walkthrough.step3Body'),
          step4Title: t('walkthrough.step4Title'),
          step4Body: t('walkthrough.step4Body'),
        },
        burst: {
          title: t('dash.burst.title'),
          sub: t('dash.burst.sub'),
          cta: t('dash.burst.cta'),
          modalTitle: t('dash.burst.modalTitle'),
          modalSub: t('dash.burst.modalSub'),
          presets: t('dash.burst.presets'),
          customLabel: t('dash.burst.customLabel'),
          submit: t('dash.burst.submit'),
          submitting: t('dash.burst.submitting'),
          success: t('dash.burst.success'),
          successCta: t('dash.burst.successCta'),
        },
      }}
    />
  );
}
