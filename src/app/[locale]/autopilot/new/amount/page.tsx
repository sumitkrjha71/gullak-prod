import { setRequestLocale, getTranslations } from 'next-intl/server';
import { CommitmentForm } from './_commitment-form';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { suggestedDailyPaise, suggestedSweepPaise } from '@/lib/autopilot/defaults';

export default async function CommitmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string; goal?: string }>;
}) {
  const { locale } = await params;
  const { mode, goal } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  let suggestedRupees = 20;
  let goalName = '';
  let goalTargetPaise = 0;
  let goalDeadlineIso: string | null = null;

  if (session) {
    const u = await prisma.user.findUnique({ where: { id: session.userId } });
    if (u) {
      suggestedRupees =
        Math.round((mode === 'sweep' ? suggestedSweepPaise(u.incomeRange) : suggestedDailyPaise(u.incomeRange)) / 100);
    }
    if (goal) {
      const g = await prisma.goal.findUnique({ where: { id: goal } });
      if (g && g.userId === session.userId) {
        goalName = g.title;
        goalTargetPaise = Number(g.targetPaise);
        goalDeadlineIso = g.deadline ? g.deadline.toISOString() : null;
      }
    }
  }

  return (
    <CommitmentForm
      locale={locale}
      goalId={goal ?? ''}
      goalName={goalName}
      goalTargetPaise={goalTargetPaise}
      goalDeadlineIso={goalDeadlineIso}
      mode={(mode as 'fixed' | 'roundup' | 'sweep' | 'inflow_pct') ?? 'fixed'}
      suggestedRupees={suggestedRupees}
      labels={{
        title: t('commit.title'),
        sub: t('commit.sub'),
        subFallback: t('commit.subFallback'),
        perDay: t('commit.perDay'),
        tierComfortable: t('commit.tierComfortable'),
        tierComfortableSub: t('commit.tierComfortableSub'),
        tierAggressive: t('commit.tierAggressive'),
        tierAggressiveSub: t('commit.tierAggressiveSub'),
        tierRelaxed: t('commit.tierRelaxed'),
        tierRelaxedSub: t('commit.tierRelaxedSub'),
        tierDailyLabel: t('commit.tierDailyLabel'),
        tierUntil: t('commit.tierUntil'),
        tierMunafa: t('commit.tierMunafa'),
        creditBridge: t('commit.creditBridge'),
        creditBridgeCta: t('commit.creditBridgeCta'),
        projTitle: t('commit.projTitle'),
        projSaved: t('commit.projSaved'),
        projMunafa: t('commit.projMunafa'),
        projTotal: t('commit.projTotal'),
        projDisclaimer: t('commit.projDisclaimer'),
        cta: t('commit.cta'),
        hint: t('commit.hint'),
      }}
    />
  );
}
