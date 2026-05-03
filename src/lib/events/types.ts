// Domain events. Drives notifications, weekly summary, milestones (UX-shaped).
// AuditLog is separate — see lib/audit/log.ts.

export type SavingsEventType =
  | 'USER_CREATED'
  | 'GOAL_CREATED'
  | 'AUTOPILOT_SET'
  | 'PAYMENT_TRIGGERED'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_REVERSED'
  | 'GOAL_PROGRESS_UPDATED'
  | 'STREAK_INCREMENTED'
  | 'WEEKLY_SUMMARY_GENERATED'
  | 'MILESTONE_REACHED';

export type SavingsEventPayloadMap = {
  USER_CREATED: { phone: string; locale: string };
  GOAL_CREATED: { goalId: string; type: string; targetPaise: number };
  AUTOPILOT_SET: { ruleId: string; mode: string; amountPaise?: number };
  PAYMENT_TRIGGERED: { txnId: string; amountPaise: number; source: string };
  PAYMENT_SUCCESS: { txnId: string; amountPaise: number; goalId?: string; source: string };
  PAYMENT_FAILED: { txnId: string; amountPaise: number; reason: string; source: string };
  PAYMENT_REVERSED: { txnId: string; reversalOfId: string; amountPaise: number };
  GOAL_PROGRESS_UPDATED: { goalId: string; progressPct: number };
  STREAK_INCREMENTED: { currentDays: number };
  WEEKLY_SUMMARY_GENERATED: { savedPaise: number; growthPaise: number };
  MILESTONE_REACHED: { goalId: string; milestonePct: number };
};

export type SavingsEvent<T extends SavingsEventType = SavingsEventType> = {
  userId: string;
  type: T;
  payload: SavingsEventPayloadMap[T];
};
