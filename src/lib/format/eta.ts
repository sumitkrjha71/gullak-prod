// Soft, human ETA copy. "At this pace, ~6 months to go" — never a hard "6 months".

export type EtaUnit = 'days' | 'weeks' | 'months';
export type EtaResult = { value: number; unit: EtaUnit; complete: boolean };

/**
 * Estimate ETA based on remaining amount and recent saving velocity.
 * @param remainingPaise — what's left
 * @param dailyRatePaise — average daily save (use rolling 14-day window upstream)
 */
export function computeEta(remainingPaise: number | bigint, dailyRatePaise: number): EtaResult {
  const remaining = typeof remainingPaise === 'bigint' ? Number(remainingPaise) : remainingPaise;
  if (remaining <= 0) return { value: 0, unit: 'days', complete: true };
  if (dailyRatePaise <= 0) return { value: 0, unit: 'months', complete: false };
  const days = Math.ceil(remaining / dailyRatePaise);
  if (days <= 14) return { value: days, unit: 'days', complete: false };
  if (days <= 90) return { value: Math.ceil(days / 7), unit: 'weeks', complete: false };
  return { value: Math.ceil(days / 30), unit: 'months', complete: false };
}
