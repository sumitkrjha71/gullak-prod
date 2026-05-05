import { setRequestLocale } from 'next-intl/server';
import { redirect } from 'next/navigation';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { ShagunForm } from './_shagun-form';

export default async function ShagunPage({
  params,
}: {
  params: Promise<{ locale: string; goalId: string }>;
}) {
  const { locale, goalId } = await params;
  setRequestLocale(locale);

  const session = await readSession();
  if (!session) redirect(`/${locale}/onboarding/phone`);

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || !goal.isShared) redirect(`/${locale}/goals/${goalId}`);

  const isOwner = goal.userId === session!.userId;
  const isMember = isOwner
    ? true
    : !!(await prisma.goalMember.findUnique({
        where: { goalId_userId: { goalId, userId: session!.userId } },
      }));
  if (!isMember) redirect(`/${locale}/goals/${goalId}`);

  // Get all members of this goal (excluding sender).
  const allMembers = await prisma.goalMember.findMany({
    where: { goalId, userId: { not: session!.userId } },
    include: { user: true },
  });
  // Also include the goal owner if they're not already a member row + not the sender.
  let owner = null;
  if (!isOwner) {
    const ownerUser = await prisma.user.findUnique({ where: { id: goal.userId } });
    if (ownerUser) {
      owner = {
        userId: ownerUser.id,
        name: ownerUser.name?.trim() || `+91 ${ownerUser.phone.slice(0, 2)}***${ownerUser.phone.slice(-2)}`,
      };
    }
  }

  const recipients = [
    ...(owner ? [owner] : []),
    ...allMembers.map((m) => ({
      userId: m.userId,
      name: m.user.name?.trim() || `+91 ${m.user.phone.slice(0, 2)}***${m.user.phone.slice(-2)}`,
    })),
  ];

  // Sender's available Munafa
  const senderGoals = await prisma.goal.findMany({ where: { userId: session!.userId } });
  const availableMunafa = senderGoals.reduce((s, g) => s + Number(g.growthPaise), 0);

  return (
    <ShagunForm
      locale={locale}
      goalId={goalId}
      goalTitle={goal.title}
      recipients={recipients}
      availableMunafaPaise={availableMunafa}
    />
  );
}
