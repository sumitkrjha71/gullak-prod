// Khata intelligence pipeline — wires all stages together via the event bus.
// Call initKhataPipeline() once at app startup (e.g., in layout.ts server component
// or middleware). It is idempotent — safe to call multiple times.
//
// Event flow:
//   CONSENT_GRANTED
//     → ingestForConsent()
//       → emits TRANSACTIONS_FETCHED (per new month batch)
//         → rebuildProfileForUser()
//           → emits PROFILE_UPDATED
//             → generateInsights()
//             → generateRecommendations()
//               → emits RECOMMENDATION_CREATED (per rec)

import { register } from '@/lib/events/bus';
import { ingestForConsent } from '@/lib/aa/ingestion';
import { rebuildProfileForUser } from './profile';
import { generateInsights } from './insights';
import { generateRecommendations } from './recommendations';
import { syncAcceptedRecsToAutopilot } from './autopilot-adapter';
import { logger } from '@/lib/logger';

let initialized = false;

export function initKhataPipeline(): void {
  if (initialized) return;
  initialized = true;

  // ── Stage 1: Consent granted → ingest transactions ────────────────────────
  register('CONSENT_GRANTED', async ({ userId, consentId }) => {
    logger.info({ userId, consentId }, 'pipeline:consent_granted');
    await ingestForConsent(consentId, userId);
  });

  // ── Stage 2: Transactions fetched → rebuild profile ───────────────────────
  // Debounced by monthKey — only rebuild once per unique month in this run.
  // Since ingestForConsent emits once per new month, this runs ≤12× per user.
  const rebuilding = new Set<string>();
  register('TRANSACTIONS_FETCHED', async ({ userId }) => {
    if (rebuilding.has(userId)) return;
    rebuilding.add(userId);
    try {
      logger.info({ userId }, 'pipeline:transactions_fetched → rebuild_profile');
      await rebuildProfileForUser(userId);
    } finally {
      rebuilding.delete(userId);
    }
  });

  // ── Stage 3: Profile updated → insights + recommendations ────────────────
  register('PROFILE_UPDATED', async ({ userId }) => {
    logger.info({ userId }, 'pipeline:profile_updated → insights + recs');
    await Promise.all([
      generateInsights(userId),
      generateRecommendations(userId),
    ]);
  });

  // ── Stage 4: Recommendation accepted → sync to autopilot ─────────────────
  register('RECOMMENDATION_CREATED', async ({ userId }) => {
    // Only sync if there are accepted recs — this fires on creation, not acceptance.
    // The actual sync is triggered from the POST /recommendations/[id] route.
    // This handler is a no-op here but kept for future Inngest-style fan-out.
    void userId;
  });

  // ── Revocation: delete data after 30-day grace period ────────────────────
  register('CONSENT_REVOKED', async ({ userId, consentId }) => {
    logger.info({ userId, consentId }, 'pipeline:consent_revoked → schedule_data_deletion');
    // Data deletion runs via the cron endpoint at /api/cron/khata-analysis
    // which checks AAConsent.dataExpiresAt. No immediate deletion here.
  });

  logger.info({}, 'khata_pipeline_initialized');
}

/** Manual trigger: re-run the full analysis for a user (e.g. from cron or admin). */
export async function runFullAnalysis(userId: string): Promise<void> {
  await rebuildProfileForUser(userId);
  await Promise.all([
    generateInsights(userId),
    generateRecommendations(userId),
  ]);
}

/** Sync autopilot from accepted recs — called from POST /recommendations/[id]/accept */
export async function onRecommendationAccepted(userId: string): Promise<void> {
  await syncAcceptedRecsToAutopilot(userId);
}
