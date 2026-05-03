import { setRequestLocale, getTranslations } from 'next-intl/server';
import { NameForm } from './_name-form';

export default async function NamePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });
  return (
    <NameForm
      locale={locale}
      labels={{
        title: t('name.title'),
        sub: t('name.sub'),
        placeholder: t('name.placeholder'),
        cta: t('common.next'),
        skip: t('common.skip'),
      }}
    />
  );
}
