// Explicit user lifecycle FSM. Source of truth = User.lifecycleState.
// Middleware reads this on every request to decide which screen the user belongs on.

import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';

export type LifecycleState =
  | 'NEW'
  | 'ONBOARDING'
  | 'TRUST_ACKNOWLEDGED'
  | 'GOAL_CREATED'
  | 'AUTOPILOT_CONFIGURED'
  | 'MANDATE_PENDING'
  | 'ACTIVE'
  | 'PAUSED';

const transitions: Record<LifecycleState, LifecycleState[]> = {
  NEW: ['ONBOARDING'],
  ONBOARDING: ['TRUST_ACKNOWLEDGED'],
  TRUST_ACKNOWLEDGED: ['GOAL_CREATED'],
  GOAL_CREATED: ['AUTOPILOT_CONFIGURED'],
  AUTOPILOT_CONFIGURED: ['MANDATE_PENDING'],
  MANDATE_PENDING: ['ACTIVE'],
  ACTIVE: ['PAUSED'],
  PAUSED: ['ACTIVE'],
};

export function canTransition(from: LifecycleState, to: LifecycleState): boolean {
  return transitions[from]?.includes(to) ?? false;
}

/** Map a state to the canonical screen the user should land on. */
export function homeRouteFor(state: LifecycleState): string {
  switch (state) {
    case 'NEW':
      return '/onboarding';
    case 'ONBOARDING':
      return '/onboarding';
    case 'TRUST_ACKNOWLEDGED':
      return '/goals/new';
    case 'GOAL_CREATED':
      return '/autopilot/new';
    case 'AUTOPILOT_CONFIGURED':
      return '/mandate';
    case 'MANDATE_PENDING':
      return '/mandate';
    case 'ACTIVE':
    case 'PAUSED':
      return '/home';
  }
}

export async function transitionUser(userId: string, to: LifecycleState): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error(`User ${userId} not found`);
  const from = user.lifecycleState as LifecycleState;
  if (from === to) return;
  // Forward jumps allowed when the prerequisite is met (e.g., NEW → ONBOARDING after OTP, or
  // returning user already at ACTIVE doesn't need to walk back). We allow forward-or-equal,
  // and explicit ACTIVE ⇄ PAUSED via canTransition.
  const order: LifecycleState[] = [
    'NEW',
    'ONBOARDING',
    'TRUST_ACKNOWLEDGED',
    'GOAL_CREATED',
    'AUTOPILOT_CONFIGURED',
    'MANDATE_PENDING',
    'ACTIVE',
  ];
  const fromIdx = order.indexOf(from);
  const toIdx = order.indexOf(to);
  const isForward = fromIdx >= 0 && toIdx > fromIdx;
  const isPauseToggle = (from === 'ACTIVE' && to === 'PAUSED') || (from === 'PAUSED' && to === 'ACTIVE');
  if (!isForward && !isPauseToggle) {
    throw new Error(`Invalid transition: ${from} → ${to}`);
  }
  await prisma.user.update({ where: { id: userId }, data: { lifecycleState: to } });
  await writeAudit({
    userId,
    eventType: 'STATE_TRANSITION',
    payload: { from, to },
    source: 'system',
  });
}
