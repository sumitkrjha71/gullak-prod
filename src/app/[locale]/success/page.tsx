import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SuccessScreen } from './_success-screen';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

export default async function SuccessPage({
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
  let name = '';
  let amount = 20;
  if (session) {
    const u = await prisma.user.findUnique({ where: { id: session.userId } });
    name = u?.name ?? '';
    if (ruleId) {
      const rule = await prisma.autopilotRule.findUnique({ where: { id: ruleId } });
      if (rule?.amountPaise) amount = Math.round(Number(rule.amountPaise) / 100);
    }
  }

  return (
    <SuccessScreen
      locale={locale}
      name={name || 'User'}
      amount={amount}
      labels={{
        title: t('success.title', { name }),
        sub: t('success.sub'),
        tagline: t('success.tagline', { daily: String(amount), fiveYr: '...' }),
        fiveYearLabel: t('success.fiveYearLabel'),
        fiveYearSub: t('success.fiveYearSub'),
        daily: t('success.daily'),
        yr1: t('success.yr1'),
        yr5: t('success.yr5'),
        invest: t('success.invest'),
        investVal: t('success.investVal'),
        trust: t('success.trust'),
        cta: t('success.cta'),
      }}
    />
  );
}
