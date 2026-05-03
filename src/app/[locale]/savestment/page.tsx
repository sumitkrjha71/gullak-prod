import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SavestmentDeck } from './_savestment-deck';

export default async function SavestmentPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <SavestmentDeck
      locale={locale}
      labels={{
        title: t('savestment.title'),
        skip: t('savestment.skip'),
        next: t('savestment.next'),
        start: t('savestment.start'),
        slides: [
          { title: t('savestment.slides.1t'), body: t('savestment.slides.1b'), chip: t('savestment.slides.1c') },
          { title: t('savestment.slides.2t'), body: t('savestment.slides.2b'), chip: t('savestment.slides.2c') },
          { title: t('savestment.slides.3t'), body: t('savestment.slides.3b'), chip: t('savestment.slides.3c') },
          { title: t('savestment.slides.4t'), body: '', chip: '' },
        ],
        slide4Bullets: [
          t('savestment.slides.4b1'),
          t('savestment.slides.4b2'),
          t('savestment.slides.4b3'),
          t('savestment.slides.4b4'),
        ],
      }}
    />
  );
}
