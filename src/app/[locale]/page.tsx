import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SplashScreen } from './_splash';

export default async function SplashPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <SplashScreen
      locale={locale}
      labels={{
        appName: t('common.appName'),
        tagline: t('splash.tagline'),
        savestmentTop: t('splash.savestmentTop'),
        savestmentDef: t('splash.savestmentDef'),
        skip: t('splash.skip'),
      }}
    />
  );
}
