import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { Transparency } from './_transparency';

export default async function TransparencyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  const goals = await prisma.goal.findMany({
    where: { userId: session.userId, status: 'active' },
  });
  const totalSavedPaise = goals.reduce((s, g) => s + Number(g.savedPaise), 0);
  const totalSavedRupees = Math.round(totalSavedPaise / 100);

  // Mock allocation: 55% Govt Bonds, 25% Gold Bonds, 20% AAA Paper.
  const govt = Math.round(totalSavedRupees * 0.55);
  const gold = Math.round(totalSavedRupees * 0.25);
  const aaa = totalSavedRupees - govt - gold;

  return (
    <Transparency
      locale={locale}
      total={totalSavedRupees}
      breakdown={[
        { label: t('dash.instrGovBond'), value: govt, pct: 55, color: '#0E8C7A' },
        { label: t('dash.instrGoldBond'), value: gold, pct: 25, color: '#D4A017' },
        { label: t('dash.instrAAA'), value: aaa, pct: 20, color: '#1A7A4A' },
      ]}
      labels={{
        title: t('transparency.title'),
        sub: t('transparency.sub'),
        cta: t('transparency.cta'),
        rrTitle: t('transparency.rrttllu.title'),
        rows: [
          { title: t('transparency.rrttllu.risk.title'), body: t('transparency.rrttllu.risk.body') },
          { title: t('transparency.rrttllu.returns.title'), body: t('transparency.rrttllu.returns.body') },
          { title: t('transparency.rrttllu.time.title'), body: t('transparency.rrttllu.time.body') },
          { title: t('transparency.rrttllu.tenure.title'), body: t('transparency.rrttllu.tenure.body') },
          { title: t('transparency.rrttllu.liquidity.title'), body: t('transparency.rrttllu.liquidity.body') },
          { title: t('transparency.rrttllu.lockin.title'), body: t('transparency.rrttllu.lockin.body') },
          { title: t('transparency.rrttllu.understanding.title'), body: t('transparency.rrttllu.understanding.body') },
        ],
      }}
    />
  );
}
