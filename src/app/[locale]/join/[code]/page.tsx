import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { JoinLanding } from './_join-landing';

export default async function JoinPage({
  params,
}: {
  params: Promise<{ locale: string; code: string }>;
}) {
  const { locale, code } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const normalizedCode = code.trim().toUpperCase();

  // Look up the goal by invite code (server side — fast initial render).
  const goal = await prisma.goal.findUnique({
    where: { inviteCode: normalizedCode },
    include: { user: true },
  });

  if (!goal || !goal.isShared) {
    return (
      <JoinLanding
        locale={locale}
        notFound
        code={normalizedCode}
        labels={{
          headline: t('join.notFoundHeadline'),
          sub: t('join.notFoundSub'),
          backHome: t('join.backHome'),
          loginCta: t('join.loginCta'),
          alreadyMemberHeadline: t('join.alreadyMemberHeadline'),
          alreadyMemberSub: t('join.alreadyMemberSub'),
          openGoal: t('join.openGoal'),
          inviteHeadline: t('join.inviteHeadline'),
          inviteSub: t('join.inviteSub'),
          inviterLabel: t('join.inviterLabel'),
          goalLabel: t('join.goalLabel'),
          targetLabel: t('join.targetLabel'),
          progressLabel: t('join.progressLabel'),
          joinCta: t('join.joinCta'),
          joining: t('join.joining'),
          loginNeededTitle: t('join.loginNeededTitle'),
          loginNeededSub: t('join.loginNeededSub'),
          trustLine: t('join.trustLine'),
        }}
      />
    );
  }

  const session = await readSession();
  const loggedIn = !!session;

  // If they're already a member or are the owner, send them to the family view.
  if (loggedIn) {
    const isOwner = goal.userId === session!.userId;
    const isMember = isOwner
      ? true
      : !!(await prisma.goalMember.findUnique({
          where: { goalId_userId: { goalId: goal.id, userId: session!.userId } },
        }));
    if (isMember) {
      redirect(`/${locale}/goals/${goal.id}/family`);
    }
  }

  return (
    <JoinLanding
      locale={locale}
      code={normalizedCode}
      goalId={goal.id}
      goalTitle={goal.title}
      goalType={goal.type}
      goalTargetPaise={Number(goal.targetPaise)}
      goalSavedPaise={Number(goal.savedPaise)}
      inviterName={goal.user.name ?? null}
      loggedIn={loggedIn}
      labels={{
        headline: t('join.notFoundHeadline'),
        sub: t('join.notFoundSub'),
        backHome: t('join.backHome'),
        loginCta: t('join.loginCta'),
        alreadyMemberHeadline: t('join.alreadyMemberHeadline'),
        alreadyMemberSub: t('join.alreadyMemberSub'),
        openGoal: t('join.openGoal'),
        inviteHeadline: t('join.inviteHeadline'),
        inviteSub: t('join.inviteSub'),
        inviterLabel: t('join.inviterLabel'),
        goalLabel: t('join.goalLabel'),
        targetLabel: t('join.targetLabel'),
        progressLabel: t('join.progressLabel'),
        joinCta: t('join.joinCta'),
        joining: t('join.joining'),
        loginNeededTitle: t('join.loginNeededTitle'),
        loginNeededSub: t('join.loginNeededSub'),
        trustLine: t('join.trustLine'),
      }}
    />
  );
}
