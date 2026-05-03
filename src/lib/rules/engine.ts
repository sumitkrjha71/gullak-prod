// Autopilot rules engine. Each cron route asks: "should this rule fire today,
// and how much?" then calls payments.execute().

import { prisma } from '@/lib/db/client';
import { execute } from '@/lib/payments';
import { buildIdempotencyKey } from '@/lib/idempotency/key';
import { istDayOfMonth } from '@/lib/format/date';
import type { SimResult } from '@/lib/payments/simulate';

export type CronRunResult = {
  rulesEvaluated: number;
  rulesFired: number;
  successes: number;
  failures: number;
  replays: number;
  details: Array<{ ruleId: string; userId: string; result?: SimResult; skippedReason?: string }>;
};

/** Run all FIXED-mode rules that are due today. */
export async function runDailySaveCron(now: Date = new Date()): Promise<CronRunResult> {
  const rules = await prisma.autopilotRule.findMany({
    where: { mode: 'fixed', status: 'active' },
    include: { goal: true },
  });
  return runRules(rules, now, 'fixed');
}

/** Run SWEEP-mode rules where today's IST date matches the user's salary day. */
export async function runSalarySweepCron(now: Date = new Date()): Promise<CronRunResult> {
  const today = istDayOfMonth(now);
  const rules = await prisma.autopilotRule.findMany({
    where: { mode: 'sweep', status: 'active', user: { salaryDay: today } },
    include: { goal: true, user: true },
  });
  return runRules(rules, now, 'sweep');
}

async function runRules(
  rules: Array<{ id: string; userId: string; goalId: string; amountPaise: bigint | null; pauseUntil: Date | null; frequency: string | null }>,
  now: Date,
  source: 'fixed' | 'sweep',
): Promise<CronRunResult> {
  const result: CronRunResult = { rulesEvaluated: rules.length, rulesFired: 0, successes: 0, failures: 0, replays: 0, details: [] };
  for (const rule of rules) {
    if (rule.pauseUntil && rule.pauseUntil > now) {
      result.details.push({ ruleId: rule.id, userId: rule.userId, skippedReason: 'paused' });
      continue;
    }
    if (!rule.amountPaise || rule.amountPaise <= 0n) {
      result.details.push({ ruleId: rule.id, userId: rule.userId, skippedReason: 'no_amount' });
      continue;
    }
    if (source === 'fixed' && rule.frequency === 'weekly') {
      // Weekly fixed-mode rules fire on Mondays only.
      const dayOfWeek = now.getUTCDay();
      if (dayOfWeek !== 1) {
        result.details.push({ ruleId: rule.id, userId: rule.userId, skippedReason: 'weekly_not_today' });
        continue;
      }
    }
    const idempotencyKey = buildIdempotencyKey({
      userId: rule.userId,
      ruleId: rule.id,
      source,
      date: now,
      slot: 'cron',
    });
    try {
      const r = await execute({
        userId: rule.userId,
        ruleId: rule.id,
        goalId: rule.goalId,
        amountPaise: Number(rule.amountPaise),
        source,
        idempotencyKey,
      });
      result.rulesFired++;
      if (r.isReplay) result.replays++;
      else if (r.status === 'success') result.successes++;
      else result.failures++;
      result.details.push({ ruleId: rule.id, userId: rule.userId, result: r });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      result.details.push({ ruleId: rule.id, userId: rule.userId, skippedReason: msg });
    }
  }
  return result;
}
