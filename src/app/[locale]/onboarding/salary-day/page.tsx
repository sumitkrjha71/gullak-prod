import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SalaryDayForm } from './_salary-day-form';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';

export default async function SalaryDayPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  let name = '';
  if (session) {
    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    name = user?.name ?? '';
  }

  return (
    <SalaryDayForm
      locale={locale}
      labels={{
        title: t('salary.title', { name }),
        sub: t('salary.sub'),
        skip: t('salary.skip'),
        cta: t('salary.confirm'),
      }}
    />
  );
}
