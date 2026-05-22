import { setRequestLocale } from 'next-intl/server';
import { KYCFlow } from './_kyc-flow';

export default async function KYCPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <KYCFlow />;
}
