import { setRequestLocale, getTranslations } from 'next-intl/server';
import { AutopilotPicker } from './_autopilot-picker';
import { prisma } from '@/lib/db/client';
import { readSession } from '@/lib/auth/session';

export default async function AutopilotNewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ goal?: string }>;
}) {
  const { locale } = await params;
  const { goal } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  let goalName = '';
  const session = await readSession();
  if (session && goal) {
    const g = await prisma.goal.findUnique({ where: { id: goal } });
    if (g && g.userId === session.userId) goalName = g.title;
  }

  return (
    <AutopilotPicker
      locale={locale}
      goalId={goal ?? ''}
      labels={{
        title: t('autopilot.title'),
        sub: t('autopilot.sub', { goal: goalName }),
        fixedTitle: t('autopilot.fixed.title'),
        fixedDesc: t('autopilot.fixed.desc'),
        roundupTitle: t('autopilot.roundup.title'),
        roundupDesc: t('autopilot.roundup.desc'),
        sweepTitle: t('autopilot.sweep.title'),
        sweepDesc: t('autopilot.sweep.desc'),
        inflowTitle: t('autopilot.inflow.title'),
        inflowDesc: t('autopilot.inflow.desc'),
        inflowTag: t('autopilot.inflow.tag'),
        tagPopular: t('autopilot.tags.popular'),
        tagSmart: t('autopilot.tags.smart'),
        tagMax: t('autopilot.tags.max'),
        comingSoon: t('autopilot.comingSoon'),
        cta: t('common.next'),
        hint: t('autopilot.hint'),
      }}
    />
  );
}
