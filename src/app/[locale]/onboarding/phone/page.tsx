export const dynamic = 'force-dynamic';
import { setRequestLocale, getTranslations } from 'next-intl/server';
import { PhoneForm } from './_phone-form';

export default async function PhonePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <PhoneForm
      locale={locale}
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
        encrypted: t('common.trustBadge'),
      }}
    />
  );
}
