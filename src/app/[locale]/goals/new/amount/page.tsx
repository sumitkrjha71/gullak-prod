import { setRequestLocale, getTranslations } from 'next-intl/server';
import { GoalAmountForm } from './_goal-amount-form';
import { templateFor, type GoalType } from '@/lib/goals/defaults';

const VALID_TYPES: GoalType[] = [
  'wedding-family', 'wedding-own', 'home', 'car', 'bike',
  'emi', 'emergency', 'education', 'festival', 'travel', 'gold', 'custom',
];

export default async function GoalAmountPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { locale } = await params;
  const { type } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const safeType: GoalType = (VALID_TYPES as string[]).includes(type ?? '')
    ? (type as GoalType)
    : 'emergency';
  const tpl = templateFor(safeType);

  return (
    <GoalAmountForm
      locale={locale}
      type={safeType}
      goalName={t(`goals.names.${safeType}`)}
      goalSub={t(`goals.subs.${safeType}`)}
      goalEmoji={tpl.emoji}
      suggestedTargetPaise={tpl.suggestedTargetPaise}
      labels={{
        amountTitle: t('goals.amountTitle'),
        amountSub: t('goals.amountSub'),
        suggestion: t('goals.amountSuggestion'),
        timelineTitle: t('goals.timelineTitle'),
        timelineSub: t('goals.timelineSub'),
        timelineReadout: t('goals.timelineReadout'),
        monthLabel: t('goals.month'),
        yearLabel: t('goals.year'),
        cta: t('common.continue'),
      }}
    />
  );
}
