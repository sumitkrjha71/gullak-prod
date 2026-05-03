import { setRequestLocale, getTranslations } from 'next-intl/server';
import { GoalPicker } from './_goal-picker';
import { goalTemplates } from '@/lib/goals/defaults';

export default async function GoalsNewPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const cards = goalTemplates.map((g) => ({
    type: g.type,
    emoji: g.emoji,
    name: t(`goals.names.${g.type}`),
    range: g.rangeLabel,
    sub: t(`goals.subs.${g.type}`),
  }));

  return (
    <GoalPicker
      locale={locale}
      cards={cards}
      labels={{
        title: t('goals.title'),
        sub: t('goals.sub'),
      }}
    />
  );
}
