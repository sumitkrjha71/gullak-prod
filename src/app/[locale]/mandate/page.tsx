import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { MandateScreen } from './_mandate-screen';
import { prisma } from '@/lib/db/client';
import { readSession } from '@/lib/auth/session';

export default async function MandatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ rule?: string }>;
}) {
  const { locale } = await params;
  const { rule: ruleId } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}/onboarding/phone`);
  if (!ruleId) redirect(`/${locale}/home`);

  const rule = await prisma.autopilotRule.findUnique({ where: { id: ruleId } });
  if (!rule || rule.userId !== session.userId) redirect(`/${locale}/home`);

  const amountRupees = rule.amountPaise ? Math.round(Number(rule.amountPaise) / 100) : 20;

  return (
    <MandateScreen
      locale={locale}
      ruleId={ruleId}
      amount={amountRupees}
      labels={{
        title: t('mandate.title'),
        sub: t('mandate.sub'),
        daily: t('mandate.daily'),
        freq: t('mandate.freq'),
        freqVal: t('mandate.freqVal'),
        mode: t('mandate.mode'),
        modeVal: t('mandate.modeVal'),
        cancel: t('mandate.cancel'),
        cancelVal: t('mandate.cancelVal'),
        flowTitle: t('mandate.flowTitle'),
        bank: t('mandate.bank'),
        gullak: t('mandate.gullak'),
        agree: t('mandate.agree', { amount: amountRupees }),
        cta: t('mandate.cta'),
        trust: t('mandate.trust'),
        failure: t('mandate.failure'),
      }}
    />
  );
}
