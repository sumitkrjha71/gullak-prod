export const dynamic = 'force-dynamic';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PhoneForm } from './_phone-form';

// Demo mode is ON when:
//   - NODE_ENV !== 'production' (local dev), OR
//   - NEXT_PUBLIC_DEMO_MODE === 'true' (explicit override for staging demos)
// In live production the demo OTP UI is hidden so real users see a real flow.
function isDemoModeServer(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

export default async function PhonePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <PhoneForm
      locale={locale}
      demoMode={isDemoModeServer()}
      labels={{
        title: t('phone.title'),
        sub: t('phone.sub'),
        placeholder: t('phone.placeholder'),
        why: t('phone.hint'),
        whyLabel: '',
        send: t('phone.send'),
        sending: t('phone.sending'),
        invalid: t('phone.invalid'),
        demoHint: t('phone.demoHint'),
        sendError: t('phone.sendError'),
        encrypted: t('common.trustBadge'),
      }}
    />
  );
}
