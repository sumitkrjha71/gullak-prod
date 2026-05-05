import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { StepHeader } from '@/components/flow/StepHeader';
import { LanguageSwitcher } from '@/components/flow/LanguageSwitcher';
import { PrivacyNote } from '@/components/trust/PrivacyNote';
import { SettingsSimulation } from './_settings-simulation';
import { SettingsRules } from './_settings-rules';
import type { Locale } from '@/lib/i18n/config';

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  // Stale session or DB unreachable → bounce to phone entry (NOT to splash,
  // which would re-redirect here and loop).
  const user = await prisma.user
    .findUnique({
      where: { id: session.userId },
      include: {
        rules: { include: { goal: true } },
        preferences: true,
      },
    })
    .catch(() => null);
  if (!user) redirect(`/${locale}/onboarding/phone`);

  const rules = user.rules.map((r) => ({
    id: r.id,
    mode: r.mode,
    goalTitle: r.goal.title,
    amountPaise: r.amountPaise ? Number(r.amountPaise) : null,
    status: r.status,
  }));

  return (
    <main className="min-h-dvh bg-bg pb-24">
      <div className="safe-top mx-auto w-full max-w-md px-5 pt-3">
        <StepHeader />
      </div>
      <div className="mx-auto w-full max-w-md px-5">
        <h1 className="text-h2 font-semibold tracking-tight">{t('settings.title')}</h1>

        <Section title={t('settings.sectionLanguage')}>
          <div className="card flex items-center justify-between p-4">
            <span className="text-[14px]">{t('onboarding.language.title')}</span>
            <LanguageSwitcher current={locale as Locale} label={t('onboarding.language.title')} />
          </div>
        </Section>

        <Section title={t('settings.sectionPrivacy')}>
          <div className="card p-4">
            <PrivacyNote>{t('settings.privacyNote')}</PrivacyNote>
          </div>
        </Section>

        <Section title={t('settings.sectionRules')}>
          <SettingsRules
            rules={rules}
            labels={{
              fixedLabel: t('settings.rules.fixedLabel'),
              roundupLabel: t('settings.rules.roundupLabel'),
              sweepLabel: t('settings.rules.sweepLabel'),
              active: t('settings.rules.active'),
              paused: t('settings.rules.paused'),
              stopped: t('settings.rules.stopped'),
              pause: t('settings.rules.pause'),
              resume: t('settings.rules.resume'),
              stop: t('settings.rules.stop'),
              noneTitle: t('settings.rules.noneTitle'),
              noneSub: t('settings.rules.noneSub'),
            }}
          />
        </Section>

        <Section title={t('settings.sectionSimulation')}>
          <SettingsSimulation
            locale={locale}
            labels={{
              runDailySave: t('settings.sim.runDailySave'),
              runDailySaveSub: t('settings.sim.runDailySaveSub'),
              simulateSpend: t('settings.sim.simulateSpend', { amount: '480' }),
              simulateSpendSub: t('settings.sim.simulateSpendSub'),
              simulateSpendInput: t('settings.sim.simulateSpendInput'),
              runRoundup: t('settings.sim.runRoundup'),
              simulateSalary: t('settings.sim.simulateSalary'),
              simulateSalarySub: t('settings.sim.simulateSalarySub'),
              forceFailNext: t('settings.sim.forceFailNext'),
              forceFailNextSub: t('settings.sim.forceFailNextSub'),
              generateWeekly: t('settings.sim.generateWeekly'),
              generateWeeklySub: t('settings.sim.generateWeeklySub'),
            }}
            forceFailEnabled={user.preferences?.forceFailNext ?? false}
          />
        </Section>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8">
      <h3 className="mb-2 text-[12px] uppercase tracking-wider text-muted">{title}</h3>
      {children}
    </section>
  );
}
