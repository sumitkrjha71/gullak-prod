import { setRequestLocale } from 'next-intl/server';
import { ChiraiyaIntro } from './_chiraiya-intro';

export default async function ChiraiyaIntroPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <ChiraiyaIntro locale={locale} />;
}
