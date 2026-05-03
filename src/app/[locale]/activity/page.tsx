import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { formatInr } from '@/lib/format/money';
import { StepHeader } from '@/components/flow/StepHeader';
import { ActivityRow } from './_activity-row';
import { EmptyState } from '@/components/patterns/EmptyState';

export default async function ActivityPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);
  const txns = await prisma.transaction.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: { goal: true },
  });

  return (
    <main className="min-h-dvh bg-bg pb-20">
      <div className="safe-top mx-auto w-full max-w-md px-5 pt-3">
        <StepHeader />
      </div>
      <div className="mx-auto w-full max-w-md px-5">
        <h1 className="text-h2 font-semibold tracking-tight">{t('activity.title')}</h1>
        <p className="mt-1 text-[14px] text-muted">{t('activity.sub')}</p>

        <div className="mt-6 grid gap-2">
          {txns.length === 0 ? (
            <EmptyState title={t('activity.empty.title')} body={t('activity.empty.sub')} />
          ) : (
            txns.map((txn) => (
              <ActivityRow
                key={txn.id}
                amount={formatInr(txn.amountPaise)}
                source={t(`activity.row.${txn.source}` as never)}
                status={txn.status as 'success' | 'failed' | 'pending' | 'reversed'}
                goalTitle={txn.goal?.title ?? ''}
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
            ))
          )}
        </div>
      </div>
    </main>
  );
}
