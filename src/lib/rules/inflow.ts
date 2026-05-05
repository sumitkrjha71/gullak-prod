// V5 M2 — Inflow-percentage rule evaluator.
//
// Fires when an inflow event arrives (UPI credit, salary, bonus). Computes:
//   savePaise = inflowPaise × (rule.inflowPct / 10000)
// Capped to [10 paise, max-mandate-cap].
//
// In V5 LITE this is invoked manually via /api/sim/inflow simulator + the
// dashboard Burst-button. Real UPI inflow detection (via AA + SMS-parsing or
// upcoming UPI 2.0 events) drops in behind the same surface in a future phase.

import { prisma } from '@/lib/db/client';
import { execute } from '@/lib/payments';
import { buildIdempotencyKey } from '@/lib/idempotency/key';
import type { SimResult } from '@/lib/payments/simulate';

export type InflowFireInput = {
  userId: string;
  inflowPaise: number;
  /** Stable ID for the inflow event (e.g., the UPI ref ID, or a synthetic key for sims) */
  inflowEventId: string;
};

/**
 * Fire all active inflow_pct rules for a user given an incoming credit amount.
 * Idempotent — re-firing with the same `inflowEventId` returns existing transactions.
 */
export async function fireInflowRules(input: InflowFireInput): Promise<{
  fired: number;
  results: Array<{ ruleId: string; result: SimResult }>;
}> {
  const rules = await prisma.autopilotRule.findMany({
    where: { userId: input.userId, mode: 'inflow_pct', status: 'active' },
  });
  const results: Array<{ ruleId: string; result: SimResult }> = [];

  for (const rule of rules) {
    if (!rule.inflowPct || rule.inflowPct <= 0) continue;

    const savePaise = Math.floor((input.inflowPaise * rule.inflowPct) / 10000);
    if (savePaise < 10) continue; // sub-10-paise saves are silly

    const idempotencyKey = buildIdempotencyKey({
      userId: rule.userId,
      ruleId: rule.id,
      source: `inflow:${input.inflowEventId}`,
      date: new Date(),
      slot: 'inflow',
    });

    try {
      const r = await execute({
        userId: rule.userId,
        ruleId: rule.id,
        goalId: rule.goalId,
        amountPaise: savePaise,
        source: 'inflow_pct',
        idempotencyKey,
      });
      results.push({ ruleId: rule.id, result: r });
    } catch {
      // Best-effort: skip on errors, audit log inside execute() captures failures.
    }
  }

  return { fired: results.length, results };
}

/**
 * Burst-mode: user-triggered one-shot save. "Got a bonus? Lock it now."
 * Routes to user's primary goal (or specified goal). Bypasses inflow-pct rules —
 * user explicitly chose the amount.
 */
export async function fireBurst(input: {
  userId: string;
  amountPaise: number;
  goalId?: string;
  note?: string;
}): Promise<SimResult> {
  // Find the goal: explicit, or the user's primary, or the most-recent active.
  let goalId = input.goalId;
  if (!goalId) {
    const primary = await prisma.goal.findFirst({
      where: { userId: input.userId, status: 'active' },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'desc' }],
    });
    if (!primary) throw new Error('no_active_goal');
    goalId = primary.id;
  }

  const idempotencyKey = buildIdempotencyKey({
    userId: input.userId,
    ruleId: null,
    source: `burst:${Date.now()}`,
    date: new Date(),
    slot: 'burst',
  });

  return execute({
    userId: input.userId,
    ruleId: null,
    goalId,
    amountPaise: input.amountPaise,
    source: 'burst',
    idempotencyKey,
  });
}
