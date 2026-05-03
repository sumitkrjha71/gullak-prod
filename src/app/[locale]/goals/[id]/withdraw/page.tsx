import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect, notFound } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { WithdrawForm } from './_withdraw-form';

export default async function WithdrawPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  const goal = await prisma.goal.findUnique({ where: { id } });
  if (!goal || goal.userId !== session.userId) notFound();

  const maxRupees = Math.round(Number(goal.savedPaise) / 100);

  return (
    <WithdrawForm
      locale={locale}
      goalId={goal.id}
      goalTitle={goal.title}
      maxRupees={maxRupees}
      labels={{
        title: t('withdraw.title'),
        sub: t('withdraw.sub', { goal: goal.title }),
        amountLabel: t('withdraw.amountLabel'),
        max: t('withdraw.max', { n: new Intl.NumberFormat('en-IN').format(maxRupees) }),
        preview: t('withdraw.preview'),
        cta: t('withdraw.cta'),
        confirming: t('withdraw.confirming'),
        successTitle: t('withdraw.successTitle'),
        successSubTpl: t('withdraw.successSub', { amount: '__AMT__' }),
        successBank: t('withdraw.successBank'),
        home: t('withdraw.home'),
      }}
    />
  );
}
