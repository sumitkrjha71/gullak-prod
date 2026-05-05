import { setRequestLocale, getTranslations } from 'next-intl/server';
import { SalaryDayForm } from './_salary-day-form';

// Pure render — NO DB calls during SSR. The user's name comes from
// sessionStorage on the client (set by the name form just before navigating
// here). This makes the page render instantly and immune to Neon cold-starts.
export default async function SalaryDayPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <SalaryDayForm
      locale={locale}
      labels={{
        // Placeholder name — the client component swaps in the real name from
        // sessionStorage on mount. If sessionStorage is empty, falls back to
        // 'Dost' for a friendly tone.
        titleTemplate: t('salary.title', { name: '__NAME__' }),
        sub: t('salary.sub'),
        skip: t('salary.skip'),
        cta: t('salary.confirm'),
      }}
    />
  );
}
