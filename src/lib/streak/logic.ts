// Streak logic. Allow 1 missed day per ISO week as a buffer (per spec — flexible > rigid).

import { prisma } from '@/lib/db/client';
import { istDateKey, istWeekKey, daysBetweenIST } from '@/lib/format/date';

export async function bumpStreakOnSuccess(userId: string): Promise<void> {
  const now = new Date();
  const dateKey = istDateKey(now);
  const weekKey = istWeekKey(now);

  const existing = await prisma.streak.findUnique({ where: { userId } });
  if (!existing) {
    await prisma.streak.create({
      data: {
        userId,
        currentDays: 1,
        longestDays: 1,
        lastSavedDate: new Date(`${dateKey}T00:00:00Z`),
        weekKey,
      },
    });
    return;
  }

  // Reset weekly buffer on week change.
  let freebies = existing.freebiesUsed;
  let week = existing.weekKey ?? weekKey;
  if (week !== weekKey) {
    freebies = 0;
    week = weekKey;
  }

  const last = existing.lastSavedDate;
  if (!last) {
    await prisma.streak.update({
      where: { userId },
      data: {
        currentDays: 1,
        longestDays: Math.max(existing.longestDays, 1),
        lastSavedDate: new Date(`${dateKey}T00:00:00Z`),
        freebiesUsed: freebies,
        weekKey: week,
      },
    });
    return;
  }

  const lastKey = istDateKey(last);
  if (lastKey === dateKey) {
    // Already counted today — no change.
    return;
  }

  const gap = daysBetweenIST(last, now);
  let newCurrent = existing.currentDays;
  if (gap === 1) {
    newCurrent = existing.currentDays + 1;
  } else if (gap === 2 && freebies < 1) {
    // Use one weekly freebie to absorb a single missed day.
    newCurrent = existing.currentDays + 1;
    freebies += 1;
  } else {
    newCurrent = 1;
  }

  await prisma.streak.update({
    where: { userId },
    data: {
      currentDays: newCurrent,
      longestDays: Math.max(existing.longestDays, newCurrent),
      lastSavedDate: new Date(`${dateKey}T00:00:00Z`),
      freebiesUsed: freebies,
      weekKey: week,
    },
  });
}
