import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { SplashScreen } from './_splash';
import { readSession } from '@/lib/auth/session';

// Force dynamic so the session cookie check happens per-request and never
// gets cached. Without this, Next.js may statically render the splash and
// skip the redirect for already-logged-in users.
export const dynamic = 'force-dynamic';

export default async function SplashPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Logged-in users skip splash + onboarding entirely → straight to dashboard.
  // Session JWT lives 30 days in an httpOnly cookie; only /api/auth/signout clears it.
  const session = await readSession();
  if (session) {
    redirect(`/${locale}/home`);
  }

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
