import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { runDailySaveCron, runSalarySweepCron } from '@/lib/rules/engine';
import { dispatch } from '@/lib/events/bus';
import { prisma } from '@/lib/db/client';

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false }, { status: 401 });
  const { which } = await req.json();

  if (which === 'daily-save') {
    const r = await runDailySaveCron();
    return NextResponse.json({ ok: true, result: r });
  }
  if (which === 'salary-sweep') {
    // Force-fire for current user regardless of salary day, by running once with all sweep rules.
    const sweep = await prisma.autopilotRule.findMany({
      where: { mode: 'sweep', status: 'active', userId: session.userId },
    });
    const { execute } = await import('@/lib/payments');
    const { buildIdempotencyKey } = await import('@/lib/idempotency/key');
    const out = [];
    for (const rule of sweep) {
      if (!rule.amountPaise) continue;
      const key = buildIdempotencyKey({
        userId: session.userId,
        ruleId: rule.id,
        source: 'sweep',
        slot: 'manual-sweep',
      });
      const r = await execute({
        userId: session.userId,
        ruleId: rule.id,
        goalId: rule.goalId,
        amountPaise: Number(rule.amountPaise),
        source: 'sweep',
        idempotencyKey: key,
      });
      out.push(r);
    }
    if (out.length === 0) {
      // Fall back to the standard cron (in case the user's salary day matches today)
      const r = await runSalarySweepCron();
      return NextResponse.json({ ok: true, result: r });
    }
    return NextResponse.json({ ok: true, fired: out.length });
  }
  if (which === 'weekly-summary') {
    const since = new Date(Date.now() - 7 * 86400000);
    const txns = await prisma.transaction.findMany({
      where: { userId: session.userId, status: 'success', createdAt: { gte: since } },
    });
    const saved = txns.reduce((s, t) => s + Number(t.amountPaise), 0);
    const growth = Math.floor(saved * 0.0002 * 7);
    if (saved > 0) {
      await dispatch({
        userId: session.userId,
        type: 'WEEKLY_SUMMARY_GENERATED',
        payload: { savedPaise: saved, growthPaise: growth },
      });
    }
    return NextResponse.json({ ok: true, savedPaise: saved, growthPaise: growth });
  }
  return NextResponse.json({ ok: false, error: 'unknown_cron' }, { status: 400 });
}
