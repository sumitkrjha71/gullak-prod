import { setRequestLocale, getTranslations } from 'next-intl/server';
import { TrustCheckpoint } from './_trust-checkpoint';

// Pure render — NO DB calls during SSR. Name comes from sessionStorage on
// the client (set by the name form). Same pattern as /onboarding/salary-day.
export default async function TrustCheckpointPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <TrustCheckpoint
      locale={locale}
      labels={{
        badge: t('trust.badge'),
        // Placeholder __NAME__ swapped on client mount from sessionStorage.
        titleTemplate: t('trust.title', { name: '__NAME__' }),
        cta: t('trust.cta'),
        footer: t('trust.footer'),
        items: [
          { titleKey: t('trust.1t'), descKey: t('trust.1d'), bg: '#e6f7f4', icon: '🏛️' },
          { titleKey: t('trust.2t'), descKey: t('trust.2d'), bg: '#FFF5EC', icon: '🔐' },
          { titleKey: t('trust.3t'), descKey: t('trust.3d'), bg: '#f0f7e6', icon: '📊', info: t('trust.3info') },
          { titleKey: t('trust.4t'), descKey: t('trust.4d'), bg: '#FFF5EC', icon: '🏺' },
          { titleKey: t('trust.5t'), descKey: t('trust.5d'), bg: '#e6f7f4', icon: '🛡️' },
        ],
      }}
    />
  );
}
