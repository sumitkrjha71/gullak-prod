// Append-only audit log. The system of record for state transitions, txns, mandates, flags.
// No update/delete code paths exist — this file is the only writer.

import { prisma } from '@/lib/db/client';

export type AuditSource = 'user' | 'cron' | 'system';

export type AuditEventType =
  | 'STATE_TRANSITION'
  | 'TXN_CREATED'
  | 'TXN_REVERSED'
  | 'TXN_FAILED'
  | 'MANDATE_AUTHORISED'
  | 'MANDATE_CREATED'
  | 'MANDATE_ACTIVATED'
  | 'MANDATE_REVOKED'
  | 'MANDATE_HALTED'
  | 'MANDATE_EXPIRED'
  | 'GOAL_CREATED'
  | 'GOAL_PAUSED'
  | 'GOAL_RESUMED'
  | 'GOAL_STOPPED'
  | 'RULE_CREATED'
  | 'RULE_PAUSED'
  | 'RULE_RESUMED'
  | 'RULE_STOPPED'
  | 'PREF_CHANGED'
  | 'FLAG_CHANGED'
  | 'WEEKLY_SUMMARY_GENERATED'
  | 'ROUNDUP_BUCKET_UPDATED'
  | 'NOTIFICATION_CREATED'
  | 'RISK_PROFILE_SUBMITTED'
  | 'SUITABILITY_BLOCKED'
  | 'GRIEVANCE_CREATED'
  | 'GRIEVANCE_RESOLVED';

export async function writeAudit(args: {
  userId?: string | null;
  eventType: AuditEventType;
  payload: Record<string, unknown>;
  source: AuditSource;
}) {
  await prisma.auditLog.create({
    data: {
      userId: args.userId ?? null,
      eventType: args.eventType,
      payload: JSON.stringify(args.payload, bigintReplacer),
      source: args.source,
    },
  });
}

function bigintReplacer(_k: string, v: unknown) {
  return typeof v === 'bigint' ? v.toString() : v;
}
