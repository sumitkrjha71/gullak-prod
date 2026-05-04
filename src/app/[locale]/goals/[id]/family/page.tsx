import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { FamilyView } from './_family-view';

export default async function FamilyPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id: goalId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}/onboarding/phone`);

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) redirect(`/${locale}/goals`);

  const isOwner = goal.userId === session!.userId;
  const isMember = isOwner
    ? true
    : !!(await prisma.goalMember.findUnique({
        where: { goalId_userId: { goalId, userId: session!.userId } },
      }));
  if (!isMember) redirect(`/${locale}/goals`);

  return (
    <FamilyView
      locale={locale}
      goalId={goalId}
      goalTitle={goal.title}
      goalType={goal.type}
      goalTargetPaise={Number(goal.targetPaise)}
      goalSavedPaise={Number(goal.savedPaise)}
      isShared={goal.isShared}
      inviteCode={goal.inviteCode}
      isOwner={isOwner}
      labels={{
        headline: t('family.headline'),
        sub: t('family.sub'),
        soloHeadline: t('family.soloHeadline'),
        soloSub: t('family.soloSub'),
        inviteCta: t('family.inviteCta'),
        generating: t('family.generating'),
        codeLabel: t('family.codeLabel'),
        copyCode: t('family.copyCode'),
        codeCopied: t('family.codeCopied'),
        whatsappShare: t('family.whatsappShare'),
        membersTitle: t('family.membersTitle'),
        roleOwner: t('family.roleOwner'),
        roleMember: t('family.roleMember'),
        contributed: t('family.contributed'),
        combined: t('family.combined'),
        targetLabel: t('family.targetLabel'),
        progressShabaash: t('family.progressShabaash'),
        backToGoal: t('family.backToGoal'),
        howItWorks: t('family.howItWorks'),
        howStep1: t('family.howStep1'),
        howStep2: t('family.howStep2'),
        howStep3: t('family.howStep3'),
      }}
    />
  );
}
