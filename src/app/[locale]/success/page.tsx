import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SuccessScreen } from './_success-screen';

// Pure render — NO DB calls. Name + amount come from sessionStorage on the
// client (set by /onboarding/name and /autopilot/new/amount respectively).
export default async function SuccessPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <SuccessScreen
      locale={locale}
      labels={{
        // Templated — client swaps __NAME__ and __AMOUNT__ from sessionStorage.
        titleTemplate: t('success.title', { name: '__NAME__' }),
        sub: t('success.sub'),
        taglineTemplate: t('success.tagline', { daily: '__AMOUNT__', fiveYr: '...' }),
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
