import { setRequestLocale } from 'next-intl/server';
import { PitchView } from './_pitch';

export const metadata = {
  title: 'Gullak — Bharat ka Savestment Platform',
  description: 'TAM, GTM, model, and traction for the Gullak investor view.',
};

export default async function PitchPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <PitchView locale={locale} />;
}
