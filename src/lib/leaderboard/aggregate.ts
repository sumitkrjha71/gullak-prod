// V5 M10 — Leaderboard aggregation (lite scope).
//
// Daily cron snapshots the top savers per state for the current month.
// Anonymized: only first-name + last-initial.
//
// Lookup: given a userId, returns their rank within their state.

import { prisma } from '@/lib/db/client';

export type RankSnapshot = {
  userId: string;
  rank: number;
  scopeKey: string; // state code or 'all'
  totalSavers: number; // total in scope for context
  percentile: number; // 100 - (rank/total*100); higher = better
  savedRupees: number;
  munafaRupees: number;
};

function periodKeyFor(date: Date = new Date()): string {
  const yr = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  return `${yr}-${mo}`;
}

function anonNameOf(name: string | null, phone: string): string {
  if (name && name.trim().length > 0) {
    const parts = name.trim().split(/\s+/);
    const first = parts[0];
    const lastInitial = parts.length > 1 ? parts[parts.length - 1].charAt(0).toUpperCase() : '';
    return `${first.charAt(0).toUpperCase()}${first.slice(1).toLowerCase()}${lastInitial ? ' ' + lastInitial + '.' : ''}`;
  }
  return `Saver ${phone.slice(-2)}`;
}

/**
 * Compute fresh leaderboard for a given month + scope. State-scoped: groups
 * users by `User.state`. Returns top-N saved-this-period for each state.
 */
export async function computeStateLeaderboard(
  periodKey: string = periodKeyFor(),
  topN = 100,
): Promise<Array<{ scopeKey: string; ranks: Array<{ userId: string; rank: number; anonName: string; savedPaise: number; munafaPaise: number }> }>> {
  // Period bounds
  const [yr, mo] = periodKey.split('-').map(Number);
  const start = new Date(yr, mo - 1, 1);
  const end = new Date(yr, mo, 1);

  // Sum saved-paise per user in this period (success transactions only).
  const grouped = await prisma.transaction.groupBy({
    by: ['userId'],
    where: { status: 'success', createdAt: { gte: start, lt: end } },
    _sum: { amountPaise: true },
  });

  if (grouped.length === 0) return [];

  // Pull users' state for grouping.
  const userIds = grouped.map((g) => g.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, phone: true, state: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  // Bucket by state.
  const byState = new Map<string, Array<{ userId: string; saved: number }>>();
  for (const g of grouped) {
    const u = userMap.get(g.userId);
    if (!u || !u.state) continue;
    const arr = byState.get(u.state) ?? [];
    arr.push({ userId: g.userId, saved: Number(g._sum.amountPaise ?? 0) });
    byState.set(u.state, arr);
  }

  const result: Array<{ scopeKey: string; ranks: Array<{ userId: string; rank: number; anonName: string; savedPaise: number; munafaPaise: number }> }> = [];

  for (const [state, list] of byState) {
    list.sort((a, b) => b.saved - a.saved);
    const top = list.slice(0, topN);

    const ranks = top.map((item, idx) => {
      const u = userMap.get(item.userId)!;
      return {
        userId: item.userId,
        rank: idx + 1,
        anonName: anonNameOf(u.name, u.phone),
        savedPaise: item.saved,
        munafaPaise: Math.round(item.saved * 0.04), // approx 4% munafa proxy
      };
    });

    result.push({ scopeKey: state, ranks });
  }

  return result;
}

/**
 * Persist a fresh snapshot — wipes prior month's snapshot for same scope+key,
 * inserts new rows. Used by /api/cron/leaderboard-snapshot.
 */
export async function persistLeaderboardSnapshot(periodKey: string = periodKeyFor()): Promise<{ persistedRows: number }> {
  const buckets = await computeStateLeaderboard(periodKey);
  let total = 0;

  for (const b of buckets) {
    // Replace existing
    await prisma.leaderboardSnapshot.deleteMany({
      where: { periodKey, scope: 'state', scopeKey: b.scopeKey },
    });

    if (b.ranks.length === 0) continue;

    await prisma.leaderboardSnapshot.createMany({
      data: b.ranks.map((r) => ({
        periodKey,
        scope: 'state',
        scopeKey: b.scopeKey,
        rank: r.rank,
        userId: r.userId,
        anonName: r.anonName,
        savedPaise: BigInt(r.savedPaise),
        munafaPaise: BigInt(r.munafaPaise),
      })),
    });
    total += b.ranks.length;
  }

  return { persistedRows: total };
}

/**
 * Look up a user's rank in their state for the current period.
 * If snapshot is stale or missing, returns null — caller can show "not yet ranked".
 */
export async function getUserRank(userId: string): Promise<RankSnapshot | null> {
  const periodKey = periodKeyFor();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.state) return null;

  const ownEntry = await prisma.leaderboardSnapshot.findFirst({
    where: { periodKey, scope: 'state', scopeKey: user.state, userId },
  });
  const total = await prisma.leaderboardSnapshot.count({
    where: { periodKey, scope: 'state', scopeKey: user.state },
  });

  if (!ownEntry || total === 0) return null;

  return {
    userId,
    rank: ownEntry.rank,
    scopeKey: user.state,
    totalSavers: total,
    percentile: Math.max(0, Math.round(100 - (ownEntry.rank / total) * 100)),
    savedRupees: Math.round(Number(ownEntry.savedPaise) / 100),
    munafaRupees: Math.round(Number(ownEntry.munafaPaise) / 100),
  };
}
