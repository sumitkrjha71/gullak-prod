// Autopilot adapter — applies accepted recommendations back into AutopilotRule.
// Called when a RECOMMENDATION_ACCEPTED event fires (or directly from API route).
// Keeps Khata intelligence and the existing autopilot rule engine in sync.

import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';

export async function syncAcceptedRecsToAutopilot(userId: string): Promise<void> {
  const accepted = await prisma.autopilotRecommendation.findMany({
    where: { userId, status: 'accepted' },
    orderBy: { acceptedAt: 'desc' },
  });

  const activeRule = await prisma.autopilotRule.findFirst({
    where: { userId, status: 'active' },
    orderBy: { createdAt: 'desc' },
  });

  for (const rec of accepted) {
    try {
      await applyRec(userId, rec, activeRule);
    } catch (err) {
      logger.error({ userId, recId: rec.id, err: (err as Error).message }, 'apply_rec_failed');
    }
  }
}

async function applyRec(
  userId:     string,
  rec:        { id: string; recType: string; suggestedValuePaise: bigint | null },
  activeRule: { id: string; amountPaise: bigint | null; status: string } | null,
): Promise<void> {
  switch (rec.recType) {

    case 'adjust_save_amount': {
      if (!rec.suggestedValuePaise) return;
      if (activeRule) {
        await prisma.autopilotRule.update({
          where: { id: activeRule.id },
          data:  { amountPaise: rec.suggestedValuePaise },
        });
        logger.info({ userId, recId: rec.id, newAmount: rec.suggestedValuePaise }, 'autopilot_amount_adjusted');
      }
      break;
    }

    case 'pause_autopilot': {
      if (activeRule) {
        await prisma.autopilotRule.update({
          where: { id: activeRule.id },
          data:  { status: 'paused' },
        });
        logger.info({ userId, recId: rec.id }, 'autopilot_paused');
      }
      break;
    }

    case 'resume_autopilot': {
      if (activeRule && activeRule.status === 'paused') {
        await prisma.autopilotRule.update({
          where: { id: activeRule.id },
          data:  { status: 'active' },
        });
        logger.info({ userId, recId: rec.id }, 'autopilot_resumed');
      }
      break;
    }

    case 'increase_sip': {
      // SIP adjustments are handled by Phase 5 (BSE StAR MF) — log only
      logger.info({ userId, recId: rec.id, suggested: rec.suggestedValuePaise }, 'sip_increase_accepted_by_user');
      break;
    }

    // These rec types have no direct autopilot mutation — they're advisory
    case 'build_emergency_fund':
    case 'start_sip':
    case 'allocate_surplus':
    case 'debt_paydown':
      logger.info({ userId, recId: rec.id, recType: rec.recType }, 'advisory_rec_accepted');
      break;

    default:
      logger.warn({ userId, recId: rec.id, recType: rec.recType }, 'unknown_rec_type');
  }
}
