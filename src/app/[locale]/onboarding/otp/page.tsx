import { setRequestLocale, getTranslations } from 'next-intl/server';
import { OtpForm } from './_otp-form';

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
        encrypted: t('common.trustBadge'),
      }}
    />
  );
}
