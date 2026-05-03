import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { getTodayBucket } from '@/lib/rules/roundup';
import { prisma } from '@/lib/db/client';
import { RoundupConfirm } from './_roundup-confirm';

export default async function RoundupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  const bucket = await getTodayBucket(session.userId);
  const totalR = Math.round(bucket.pendingPaise / 100);

  // Find a goal to attach to (primary or first active).
  const goal = await prisma.goal.findFirst({
    where: { userId: session.userId, status: 'active' },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });

  const items = bucket.items.map((it) => ({
    spend: `₹${new Intl.NumberFormat('en-IN').format(Math.round(it.spendPaise / 100))}`,
    rounded: `₹${new Intl.NumberFormat('en-IN').format(Math.round(it.roundedToPaise / 100))}`,
    save: `₹${new Intl.NumberFormat('en-IN').format(Math.round(it.savePaise / 100))}`,
  }));

  return (
    <RoundupConfirm
      locale={locale}
      goalId={goal?.id ?? null}
      goalTitle={goal?.title ?? ''}
      totalRupees={totalR}
      itemCount={bucket.items.length}
      items={items}
      labels={{
        title: t('roundup.title'),
        sub: t('roundup.sub', { total: new Intl.NumberFormat('en-IN').format(totalR) }),
        primary: t('roundup.primary', { total: new Intl.NumberFormat('en-IN').format(totalR) }),
        secondary: t('roundup.secondary'),
        items: t('roundup.items'),
        spend: t('roundup.spend'),
        rounded: t('roundup.rounded'),
        save: t('roundup.save'),
        totalLabel: t('roundup.totalLabel'),
        added: t('roundup.added', { total: new Intl.NumberFormat('en-IN').format(totalR) }),
        emptyTitle: t('roundup.empty.title'),
        emptySub: t('roundup.empty.sub'),
        undo: t('money.undoToast', { amount: new Intl.NumberFormat('en-IN').format(totalR) }),
      }}
    />
  );
}
