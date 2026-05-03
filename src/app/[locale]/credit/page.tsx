import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { evaluateUser } from '@/lib/credit/eligibility';
import { CreditList } from './_credit-list';

export default async function CreditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  const e = await evaluateUser(session.userId);
  const fmtMax = (paise: number) => {
    if (paise >= 1_00_00_000) return `${(paise / 1_00_00_000).toFixed(1).replace('.0', '')} L`;
    if (paise >= 1_00_000) return `${(paise / 1_00_000).toFixed(1).replace('.0', '')} L`;
    if (paise >= 1_000_00) return `${Math.round(paise / 1_000_00)} K`;
    return `${Math.round(paise / 100)}`;
  };

  return (
    <CreditList
      locale={locale}
      eligible={e.eligible}
      reason={e.reason ?? 'ok'}
      daysSinceFirstSave={e.daysSinceFirstSave}
      hasAAConsent={e.hasAAConsent}
      products={e.products.map((p) => ({
        type: p.type,
        name: t(`credit.products.${p.type}` as never),
        desc: t(`credit.productDesc.${p.type}` as never, { max: fmtMax(p.maxPaise) }),
        maxRupees: Math.round(p.maxPaise / 100),
        ratePct: (p.indicativeRatePctBps / 100).toFixed(1),
      }))}
      labels={{
        title: t('credit.title'),
        sub: t('credit.sub'),
        preApproved: t('credit.preApprovedTag'),
        savingFirst: t('credit.savingFirst'),
        viewDetails: t('credit.viewDetails'),
        needs30Days: t('credit.needs30Days'),
        needsMandate: t('credit.needsMandate'),
        needsAA: t('credit.needsAA'),
        connectAA: t('credit.connectAA'),
        skip: t('credit.skip'),
        indicativeRate: t('credit.indicativeRate', { rate: '__RATE__' }),
        applyTrust: t('credit.applyTrust'),
      }}
    />
  );
}
