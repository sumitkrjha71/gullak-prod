import { setRequestLocale, getTranslations } from 'next-intl/server';
import { CommitmentForm } from './_commitment-form';

// Pure render — NO DB calls. Goal data + suggested amount come from
// sessionStorage on the client (set by /goals/new/amount form). The form
// uses a sensible default if storage is empty.
export default async function CommitmentPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ mode?: string; goal?: string }>;
}) {
  const { locale } = await params;
  const { mode, goal } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  return (
    <CommitmentForm
      locale={locale}
      goalId={goal ?? ''}
      mode={(mode as 'fixed' | 'roundup' | 'sweep' | 'inflow_pct') ?? 'fixed'}
      labels={{
        title: t('commit.title'),
        sub: t('commit.sub'),
        subFallback: t('commit.subFallback'),
        perDay: t('commit.perDay'),
        tierComfortable: t('commit.tierComfortable'),
        tierComfortableSub: t('commit.tierComfortableSub'),
        tierAggressive: t('commit.tierAggressive'),
        tierAggressiveSub: t('commit.tierAggressiveSub'),
        tierRelaxed: t('commit.tierRelaxed'),
        tierRelaxedSub: t('commit.tierRelaxedSub'),
        tierDailyLabel: t('commit.tierDailyLabel'),
        tierUntil: t('commit.tierUntil'),
        tierMunafa: t('commit.tierMunafa'),
        creditBridge: t('commit.creditBridge'),
        creditBridgeCta: t('commit.creditBridgeCta'),
        projTitle: t('commit.projTitle'),
        projSaved: t('commit.projSaved'),
        projMunafa: t('commit.projMunafa'),
        projTotal: t('commit.projTotal'),
        projDisclaimer: t('commit.projDisclaimer'),
        cta: t('commit.cta'),
        hint: t('commit.hint'),
      }}
    />
  );
}
