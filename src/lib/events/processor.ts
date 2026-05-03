// Centralized handler. All side-effects of an event live here:
// audit log, streak update, notification creation, milestone celebration.

import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';
import { bumpStreakOnSuccess } from '@/lib/streak/logic';
import type { SavingsEvent, SavingsEventType } from './types';

export async function handleEvent<T extends SavingsEventType>(event: SavingsEvent<T>): Promise<void> {
  switch (event.type) {
    case 'PAYMENT_SUCCESS': {
      const p = event.payload as SavingsEvent<'PAYMENT_SUCCESS'>['payload'];
      await writeAudit({
        userId: event.userId,
        eventType: 'TXN_CREATED',
        payload: { txnId: p.txnId, amountPaise: p.amountPaise, status: 'success' },
        source: 'system',
      });
      await bumpStreakOnSuccess(event.userId);
      // Optional: create a milestone notification if goal crossed a 25%/50%/75%/100% threshold.
      if (p.goalId) {
        await maybeCreateMilestoneNotification(event.userId, p.goalId);
      }
      break;
    }
    case 'PAYMENT_FAILED': {
      const p = event.payload as SavingsEvent<'PAYMENT_FAILED'>['payload'];
      await writeAudit({
        userId: event.userId,
        eventType: 'TXN_FAILED',
        payload: { txnId: p.txnId, amountPaise: p.amountPaise, reason: p.reason },
        source: 'system',
      });
      await prisma.notification.create({
        data: {
          userId: event.userId,
          category: 'info',
          titleKey: 'notifications.templates.saveFailed.title',
          bodyKey: 'notifications.templates.saveFailed.body',
          deepLink: '/activity',
        },
      });
      break;
    }
    case 'PAYMENT_REVERSED': {
      const p = event.payload as SavingsEvent<'PAYMENT_REVERSED'>['payload'];
      await writeAudit({
        userId: event.userId,
        eventType: 'TXN_REVERSED',
        payload: { txnId: p.txnId, reversalOfId: p.reversalOfId, amountPaise: p.amountPaise },
        source: 'user',
      });
      break;
    }
    case 'GOAL_CREATED': {
      const p = event.payload as SavingsEvent<'GOAL_CREATED'>['payload'];
      await writeAudit({
        userId: event.userId,
        eventType: 'GOAL_CREATED',
        payload: p as unknown as Record<string, unknown>,
        source: 'user',
      });
      break;
    }
    case 'AUTOPILOT_SET': {
      const p = event.payload as SavingsEvent<'AUTOPILOT_SET'>['payload'];
      await writeAudit({
        userId: event.userId,
        eventType: 'RULE_CREATED',
        payload: p as unknown as Record<string, unknown>,
        source: 'user',
      });
      break;
    }
    case 'WEEKLY_SUMMARY_GENERATED': {
      const p = event.payload as SavingsEvent<'WEEKLY_SUMMARY_GENERATED'>['payload'];
      await writeAudit({
        userId: event.userId,
        eventType: 'WEEKLY_SUMMARY_GENERATED',
        payload: p as unknown as Record<string, unknown>,
        source: 'cron',
      });
      await prisma.notification.create({
        data: {
          userId: event.userId,
          category: 'info',
          titleKey: 'notifications.templates.weeklyReady.title',
          bodyKey: 'notifications.templates.weeklyReady.body',
          deepLink: '/summary/weekly',
        },
      });
      break;
    }
    default:
      break;
  }
}

async function maybeCreateMilestoneNotification(userId: string, goalId: string) {
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return;
  const target = Number(goal.targetPaise);
  if (target <= 0) return;
  const saved = Number(goal.savedPaise);
  const pct = Math.floor((saved / target) * 100);
  const milestones = [25, 50, 75, 100];
  // Coarse — emit when current pct first hits or crosses a milestone.
  // To avoid duplicate notifications, check existing milestone notifications for this goal.
  for (const m of milestones) {
    if (pct < m) continue;
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        category: 'milestone',
        bodyParams: { contains: `"goalId":"${goalId}","pct":${m}` },
      },
    });
    if (existing) continue;
    await prisma.notification.create({
      data: {
        userId,
        category: 'milestone',
        titleKey: 'notifications.templates.milestone.title',
        bodyKey: 'notifications.templates.milestone.body',
        bodyParams: JSON.stringify({ goalId, pct: m, goal: goal.title }),
        deepLink: `/goals/${goalId}`,
      },
    });
    // Only one per fire to keep things calm.
    break;
  }
}
