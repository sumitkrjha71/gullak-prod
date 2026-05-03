import { setRequestLocale, getTranslations } from 'next-intl/server';
import { notFound, redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { evaluateUser } from '@/lib/credit/eligibility';
import { searchOffers, type LoanProductType } from '@/lib/ocen';
import { CreditDetail } from './_credit-detail';

const VALID: LoanProductType[] = ['two-wheeler', 'four-wheeler', 'gold', 'consumer-durable', 'emergency'];

export default async function CreditDetailPage({
  params,
}: {
  params: Promise<{ locale: string; product: string }>;
}) {
  const { locale, product } = await params;
  if (!(VALID as string[]).includes(product)) notFound();
  const productType = product as LoanProductType;

  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  const e = await evaluateUser(session.userId);
  const eligible = e.products.find((p) => p.type === productType);
  if (!e.eligible || !eligible) redirect(`/${locale}/credit`);

  const defaultPrincipalPaise = Math.round(eligible.maxPaise * 0.6);
  // Default tenure based on product
  const defaultTenureDays =
    productType === 'four-wheeler' ? 365 * 3
      : productType === 'two-wheeler' ? 365 * 2
      : productType === 'gold' ? 180
      : productType === 'consumer-durable' ? 365
      : 90;

  const offers = await searchOffers({
    userId: session.userId,
    productType,
    amountPaise: defaultPrincipalPaise,
    tenureDays: defaultTenureDays,
    snapshot: e.snapshot,
  });

  return (
    <CreditDetail
      locale={locale}
      productType={productType}
      productName={t(`credit.products.${productType}` as never)}
      maxRupees={Math.round(eligible.maxPaise / 100)}
      defaultPrincipalRupees={Math.round(defaultPrincipalPaise / 100)}
      defaultTenureDays={defaultTenureDays}
      offers={offers.map((o) => ({
        id: o.id,
        principalRupees: Math.round(o.principalPaise / 100),
        tenureMonths: Math.ceil(o.tenureDays / 30),
        ratePct: (o.interestPctBps / 100).toFixed(1),
        emiRupees: Math.round(o.emiPaise / 100),
        lender: o.lenderName,
      }))}
      labels={{
        detailTitle: t('credit.detailTitle'),
        principal: t('credit.principal'),
        tenure: t('credit.tenure'),
        rate: t('credit.rate'),
        emi: t('credit.emi'),
        lender: t('credit.lender'),
        lenders: t('credit.lenders'),
        applyCta: t('credit.applyCta'),
        applying: t('credit.applying'),
        applySuccess: t('credit.applySuccess'),
        applyTrust: t('credit.applyTrust'),
        tenureMonths: t('credit.tenureMonths', { n: '__N__' }),
      }}
    />
  );
}
