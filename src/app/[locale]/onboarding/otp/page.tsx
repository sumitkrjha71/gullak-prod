import { setRequestLocale, getTranslations } from 'next-intl/server';
import { OtpForm } from './_otp-form';

function isDemoModeServer(): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  return process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
}

export default async function OtpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ phone?: string }>;
}) {
  const { locale } = await params;
  const { phone } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <OtpForm
      locale={locale}
      phone={phone ?? ''}
      demoMode={isDemoModeServer()}
      labels={{
        title: t('otp.title'),
        sub: `${phone ?? ''} ${t('phone.sentTo')}`,
        demoHint: t('otp.demoHint'),
        verify: t('otp.verify'),
        verifying: t('otp.verifying'),
        wrong: t('otp.wrong'),
        why: t('phone.hint'),
        whyLabel: '',
        resend: t('otp.resend'),
        resending: t('otp.resending'),
        resent: t('otp.resent'),
        sendError: t('otp.sendError'),
        encrypted: t('common.trustBadge'),
      }}
    />
  );
}
