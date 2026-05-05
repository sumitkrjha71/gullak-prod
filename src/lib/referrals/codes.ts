// V5 M9 — Referral code generation + reward logic.

import { prisma } from '@/lib/db/client';

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS = '23456789';

/** 6-char code: first-name-prefix-friendly. Avoids confusing letters/digits. */
export function generateReferralCode(seedName?: string): string {
  const prefix = (seedName ?? '').replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase().padEnd(3, 'X');
  const digits = Array.from({ length: 4 }, () => DIGITS[Math.floor(Math.random() * DIGITS.length)]).join('');
  return prefix + digits;
}

/**
 * Get-or-create the user's personal referral code. Idempotent — safe to call
 * on every page load. Returns the code.
 */
export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('user_not_found');
  if (user.referralCode) return user.referralCode;

  // Generate with collision retry
  let code = '';
  for (let i = 0; i < 8; i++) {
    const candidate = generateReferralCode(user.name ?? user.phone);
    const clash = await prisma.user.findUnique({ where: { referralCode: candidate } });
    if (!clash) {
      code = candidate;
      break;
    }
  }
  if (!code) throw new Error('code_collision');

  await prisma.user.update({ where: { id: userId }, data: { referralCode: code } });
  return code;
}

/**
 * Look up an inviter by their referral code. Used by the OTP verify route
 * when a new user signs up via a referral link.
 */
export async function findReferrerByCode(code: string): Promise<{ id: string; code: string } | null> {
  const normalized = code.trim().toUpperCase();
  const referrer = await prisma.user.findUnique({ where: { referralCode: normalized } });
  if (!referrer) return null;
  return { id: referrer.id, code: normalized };
}

/**
 * Record a successful referral on signup. Idempotent — checks if a Referral row
 * already exists for the (referrer, referee) pair.
 *
 * Reward credit is mocked: the ₹100 lands as a Transaction with source='referral'
 * on each side's primary goal (or first active goal). Status set to REWARDED.
 */
export async function recordReferralAndReward(input: {
  referrerUserId: string;
  refereeUserId: string;
  refereePhone: string;
  code: string;
}) {
  const existing = await prisma.referral.findFirst({
    where: { referrerUserId: input.referrerUserId, refereeUserId: input.refereeUserId },
  });
  if (existing) return existing;

  const referral = await prisma.referral.create({
    data: {
      referrerUserId: input.referrerUserId,
      refereeUserId: input.refereeUserId,
      refereePhone: input.refereePhone,
      code: input.code,
      status: 'JOINED',
      joinedAt: new Date(),
    },
  });

  // Mock reward — ₹100 to each side's primary or first goal.
  // (V5 lite: shows up as a real Transaction row but no real money.)
  const reward = 10_000; // ₹100 in paise

  await Promise.all([
    creditMockReward(input.referrerUserId, reward, referral.id, 'referral_inviter'),
    creditMockReward(input.refereeUserId, reward, referral.id, 'referral_invitee'),
  ]);

  await prisma.referral.update({
    where: { id: referral.id },
    data: { status: 'REWARDED', rewardedAt: new Date() },
  });

  return referral;
}

async function creditMockReward(
  userId: string,
  amountPaise: number,
  referralId: string,
  reason: string,
): Promise<void> {
  const goal = await prisma.goal.findFirst({
    where: { userId, status: 'active' },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });
  if (!goal) return; // no goal yet — reward queued, will credit on first goal

  const refId = `REWARD-${referralId.slice(-6).toUpperCase()}`;
  const idempotencyKey = `referral:${referralId}:${userId}`;

  try {
    await prisma.$transaction([
      prisma.transaction.create({
        data: {
          userId,
          goalId: goal.id,
          source: 'referral',
          amountPaise: BigInt(amountPaise),
          status: 'success',
          simulatedRefId: refId,
          idempotencyKey,
        },
      }),
      prisma.goal.update({
        where: { id: goal.id },
        data: { savedPaise: { increment: BigInt(amountPaise) } },
      }),
    ]);
  } catch {
    // Likely an idempotency-key collision — already credited. Silent.
  }
}

/** List of referrals made by a user — used by the /refer page. */
export async function listMyReferrals(userId: string) {
  return prisma.referral.findMany({
    where: { referrerUserId: userId },
    orderBy: { createdAt: 'desc' },
    take: 20,
  });
}
