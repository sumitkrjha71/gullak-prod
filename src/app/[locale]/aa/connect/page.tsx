import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { getActiveConsent, listAvailableFips } from '@/lib/aa';
import { AAConnect } from './_aa-connect';

export default async function AAConnectPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  const existing = await getActiveConsent(session.userId);

  return (
    <AAConnect
      locale={locale}
      alreadyConnected={!!existing}
      fips={listAvailableFips()}
      labels={{
        title: t('aa.title'),
        sub: t('aa.sub'),
        explainTitle: t('aa.explainTitle'),
        explain1: t('aa.explain1'),
        explain2: t('aa.explain2'),
        explain3: t('aa.explain3'),
        selectFip: t('aa.selectFip'),
        connectCta: t('aa.connectCta'),
        connecting: t('aa.connecting'),
        connected: t('aa.connected'),
        demoNote: t('aa.demoNote'),
        alreadyConnected: t('aa.alreadyConnected'),
      }}
    />
  );
}
