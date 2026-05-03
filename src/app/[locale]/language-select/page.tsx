import { setRequestLocale, getTranslations } from 'next-intl/server';
import { LanguageSelectScreen } from './_language-select';

export default async function LanguageSelectPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <LanguageSelectScreen
      currentLocale={locale}
      labels={{
        title: t('language.title'),
        sub: t('language.sub'),
        continue: t('language.continue'),
      }}
    />
  );
}
