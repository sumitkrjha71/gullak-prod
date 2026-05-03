// Deterministic idempotency key for payment-related operations.
// Format: sha256(userId|YYYY-MM-DD-IST|ruleId|slot)
// The DB enforces @unique on Transaction.idempotencyKey — duplicates are impossible.

import crypto from 'crypto';
import { istDateKey } from '@/lib/format/date';

export function buildIdempotencyKey(args: {
  userId: string;
  ruleId?: string | null;
  source: string; // 'fixed' | 'roundup' | 'sweep' | 'manual'
  date?: Date;
  slot?: string; // e.g. 'cron' | 'manual-1' — differentiates legitimate same-day debits
}) {
  const dateKey = istDateKey(args.date ?? new Date());
  const ruleOrSource = args.ruleId ?? args.source;
  const slot = args.slot ?? args.source;
  const raw = `${args.userId}|${dateKey}|${ruleOrSource}|${slot}`;
  return crypto.createHash('sha256').update(raw).digest('hex').slice(0, 32);
}

export function buildSimulatedRefId(): string {
  // SIM-XXXXXXXX (8 hex chars) — looks like a real PSP reference.
  const r = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `SIM-${r}`;
}
