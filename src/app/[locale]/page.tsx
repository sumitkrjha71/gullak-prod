import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SplashScreen } from './_splash';
import { readSession } from '@/lib/auth/session';

// Force dynamic so the session cookie is read per-request (not cached).
export const dynamic = 'force-dynamic';

export default async function SplashPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // The splash ALWAYS renders. We pass session state down so the splash
  // can route to /home (logged-in) or /language-select (fresh user) at the
  // end of its animation, instead of doing a server-side redirect that
  // would skip the splash entirely.
  const session = await readSession();

  const t = await getTranslations({ locale });

  return (
    <SplashScreen
      locale={locale}
      isLoggedIn={!!session}
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
