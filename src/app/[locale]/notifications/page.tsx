import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { StepHeader } from '@/components/flow/StepHeader';
import { EmptyState } from '@/components/patterns/EmptyState';
import { NotificationList } from './_notification-list';

export default async function NotificationsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  const items = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return (
    <main className="min-h-dvh bg-bg pb-20">
      <div className="safe-top mx-auto w-full max-w-md px-5 pt-3">
        <StepHeader />
      </div>
      <div className="mx-auto w-full max-w-md px-5">
        <h1 className="text-h2 font-semibold tracking-tight">{t('notifications.title')}</h1>
        <p className="mt-1 text-[14px] text-muted">{t('notifications.sub')}</p>

        {items.length === 0 ? (
          <div className="mt-6">
            <EmptyState title={t('notifications.empty.title')} body={t('notifications.empty.sub')} />
          </div>
        ) : (
          <div className="mt-6">
            <NotificationList
              labels={{
                actionable: t('notifications.categoryActionable'),
                info: t('notifications.categoryInfo'),
                milestone: t('notifications.categoryMilestone'),
              }}
              items={items.map((i) => ({
                id: i.id,
                category: i.category,
                titleKey: i.titleKey,
                bodyKey: i.bodyKey,
                deepLink: i.deepLink,
                createdAt: i.createdAt.toISOString(),
                read: !!i.readAt,
              }))}
            />
          </div>
        )}
      </div>
    </main>
  );
}
