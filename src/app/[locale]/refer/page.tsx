import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { getOrCreateReferralCode, listMyReferrals } from '@/lib/referrals/codes';
import { ReferView } from './_refer-view';

export default async function ReferPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await readSession();
  if (!session) redirect(`/${locale}/onboarding/phone`);

  const code = await getOrCreateReferralCode(session!.userId);
  const referrals = await listMyReferrals(session!.userId);

  const totalEarnedPaise = referrals
    .filter((r) => r.status === 'REWARDED')
    .reduce((s, r) => s + Number(r.rewardPaise), 0);

  return (
    <ReferView
      locale={locale}
      code={code}
      totalEarnedPaise={totalEarnedPaise}
      referrals={referrals.map((r) => ({
        id: r.id,
        status: r.status,
        rewardPaise: Number(r.rewardPaise),
        joinedAt: r.joinedAt?.toISOString() ?? null,
        createdAt: r.createdAt.toISOString(),
      }))}
    />
  );
}
