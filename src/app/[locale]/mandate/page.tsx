import { setRequestLocale, getTranslations } from 'next-intl/server';
import { MandateScreen } from './_mandate-screen';

// Pure render — NO DB calls. Rule data (amount) comes from sessionStorage on
// the client (set by /autopilot/new/amount form). Falls back to ₹20.
export default async function MandatePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ rule?: string }>;
}) {
  const { locale } = await params;
  const { rule: ruleId } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <MandateScreen
      locale={locale}
      ruleId={ruleId ?? ''}
      labels={{
        title: t('mandate.title'),
        sub: t('mandate.sub'),
        daily: t('mandate.daily'),
        freq: t('mandate.freq'),
        freqVal: t('mandate.freqVal'),
        mode: t('mandate.mode'),
        modeVal: t('mandate.modeVal'),
        cancel: t('mandate.cancel'),
        cancelVal: t('mandate.cancelVal'),
        flowTitle: t('mandate.flowTitle'),
        bank: t('mandate.bank'),
        gullak: t('mandate.gullak'),
        // __AMOUNT__ placeholder swapped at the client from sessionStorage.
        agreeTemplate: t('mandate.agree', { amount: '__AMOUNT__' }),
        cta: t('mandate.cta'),
        trust: t('mandate.trust'),
        failure: t('mandate.failure'),
      }}
    />
  );
}
