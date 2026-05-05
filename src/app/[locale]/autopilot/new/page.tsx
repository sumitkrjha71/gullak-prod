import { setRequestLocale, getTranslations } from 'next-intl/server';
import { AutopilotPicker } from './_autopilot-picker';

// Pure render — NO DB calls. Goal name is read from sessionStorage on the
// client (set by /goals/new/amount form before navigation).
export default async function AutopilotNewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ goal?: string }>;
}) {
  const { locale } = await params;
  const { goal } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <AutopilotPicker
      locale={locale}
      goalId={goal ?? ''}
      labels={{
        title: t('autopilot.title'),
        // Placeholder __GOAL__ swapped at the client from sessionStorage.
        subTemplate: t('autopilot.sub', { goal: '__GOAL__' }),
        fixedTitle: t('autopilot.fixed.title'),
        fixedDesc: t('autopilot.fixed.desc'),
        roundupTitle: t('autopilot.roundup.title'),
        roundupDesc: t('autopilot.roundup.desc'),
        sweepTitle: t('autopilot.sweep.title'),
        sweepDesc: t('autopilot.sweep.desc'),
        inflowTitle: t('autopilot.inflow.title'),
        inflowDesc: t('autopilot.inflow.desc'),
        inflowTag: t('autopilot.inflow.tag'),
        tagPopular: t('autopilot.tags.popular'),
        tagSmart: t('autopilot.tags.smart'),
        tagMax: t('autopilot.tags.max'),
        comingSoon: t('autopilot.comingSoon'),
        cta: t('common.next'),
        hint: t('autopilot.hint'),
      }}
    />
  );
}
