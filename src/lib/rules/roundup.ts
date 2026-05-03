// Round-up bucket logic. Spends accumulate during the day; user confirms a single batch.

import { prisma } from '@/lib/db/client';
import { istDateKey } from '@/lib/format/date';
import { writeAudit } from '@/lib/audit/log';

export type RoundupItem = { spendPaise: number; roundedToPaise: number; savePaise: number; at: string };

export function computeRoundUp(spendPaise: number, roundUpToRupees: number = 10): {
  roundedToPaise: number;
  savePaise: number;
} {
  const stepPaise = roundUpToRupees * 100;
  if (stepPaise <= 0) return { roundedToPaise: spendPaise, savePaise: 0 };
  const remainder = spendPaise % stepPaise;
  if (remainder === 0) return { roundedToPaise: spendPaise, savePaise: 0 };
  const roundedToPaise = spendPaise + (stepPaise - remainder);
  const savePaise = roundedToPaise - spendPaise;
  return { roundedToPaise, savePaise };
}

export async function recordSpend(userId: string, spendPaise: number, roundUpToRupees: number = 10) {
  const dateKey = istDateKey();
  const { roundedToPaise, savePaise } = computeRoundUp(spendPaise, roundUpToRupees);
  if (savePaise <= 0) return { dateKey, savePaise: 0 };

  const existing = await prisma.roundupBucket.findUnique({ where: { userId } });
  let items: RoundupItem[] = [];
  if (existing && existing.dateKey === dateKey) {
    try {
      items = JSON.parse(existing.items) as RoundupItem[];
    } catch {
      items = [];
    }
  }
  items.push({ spendPaise, roundedToPaise, savePaise, at: new Date().toISOString() });

  await prisma.roundupBucket.upsert({
    where: { userId },
    update: {
      dateKey,
      pendingPaise: BigInt(items.reduce((s, i) => s + i.savePaise, 0)),
      items: JSON.stringify(items),
    },
    create: {
      userId,
      dateKey,
      pendingPaise: BigInt(savePaise),
      items: JSON.stringify(items),
    },
  });
  await writeAudit({
    userId,
    eventType: 'ROUNDUP_BUCKET_UPDATED',
    payload: { dateKey, spendPaise, savePaise },
    source: 'user',
  });
  return { dateKey, savePaise };
}

export async function getTodayBucket(userId: string) {
  const dateKey = istDateKey();
  const bucket = await prisma.roundupBucket.findUnique({ where: { userId } });
  if (!bucket || bucket.dateKey !== dateKey) {
    return { dateKey, pendingPaise: 0, items: [] as RoundupItem[] };
  }
  let items: RoundupItem[] = [];
  try {
    items = JSON.parse(bucket.items) as RoundupItem[];
  } catch {
    items = [];
  }
  return { dateKey, pendingPaise: Number(bucket.pendingPaise), items };
}

export async function clearBucket(userId: string) {
  const dateKey = istDateKey();
  await prisma.roundupBucket.upsert({
    where: { userId },
    update: { dateKey, pendingPaise: 0n, items: '[]' },
    create: { userId, dateKey, pendingPaise: 0n, items: '[]' },
  });
}
