// Runtime self-healing for the demo user. If the seed didn't run on this
// deploy (Neon cold-start during build, etc.) OR the user was wiped, we
// recreate the bare minimum on the first authenticated page hit so the
// dashboard renders cleanly.
//
// We don't try to recreate the full 35-day transaction history here — that
// is the build-time seed's job. Just enough to make /home render: User row,
// preferences, streak, and one realistic goal so the dashboard doesn't
// fall through to the 'Pick a Goal' empty state.

import { prisma } from '@/lib/db/client';

export async function ensureDemoUser(opts: {
  userId: string;
  phone: string;
  locale: string;
  name?: string | null;
}): Promise<void> {
  const { userId, phone, locale, name } = opts;
  try {
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        phone,
        name: name ?? 'Lakshay',
        locale: locale ?? 'en',
        ageRange: '25-34',
        incomeRange: '50-100k',
        state: 'Maharashtra',
        isSalaried: true,
        salaryDay: 1,
        lifecycleState: 'ACTIVE',
        preferences: { create: {} },
        streak: {
          create: {
            currentDays: 0,
            longestDays: 0,
            lastSavedDate: new Date(),
          },
        },
      },
    });

    // Also create one starter goal so the dashboard doesn't show the
    // 'Pick a Goal' empty state right after onboarding. Idempotent — only
    // creates if the user has no active goals.
    const existingGoalCount = await prisma.goal.count({
      where: { userId, status: 'active' },
    });
    if (existingGoalCount === 0) {
      await prisma.goal.create({
        data: {
          userId,
          type: 'wedding-family',
          title: 'Beti ki shaadi',
          targetPaise: BigInt(10_00_00_000), // ₹10L
          isPrimary: true,
          // Tiny seeded progress so the chart isn't entirely flat.
          savedPaise: BigInt(20_00),
          investedPaise: BigInt(20_00),
          growthPaise: BigInt(0),
        },
      });
    }
  } catch (err) {
    // Best-effort. If this fails too, /home renders with safe defaults.
    console.warn('[ensureDemoUser] failed:', (err as Error)?.message);
  }
}
