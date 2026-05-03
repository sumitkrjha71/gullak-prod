// Goal progress arithmetic. All amounts are in paise.

export function progressPct(savedPaise: number | bigint, targetPaise: number | bigint): number {
  const saved = typeof savedPaise === 'bigint' ? Number(savedPaise) : savedPaise;
  const target = typeof targetPaise === 'bigint' ? Number(targetPaise) : targetPaise;
  if (target <= 0) return 0;
  const pct = Math.min(100, Math.floor((saved / target) * 100));
  return Math.max(0, pct);
}

export function remainingPaise(savedPaise: number | bigint, targetPaise: number | bigint): number {
  const saved = typeof savedPaise === 'bigint' ? Number(savedPaise) : savedPaise;
  const target = typeof targetPaise === 'bigint' ? Number(targetPaise) : targetPaise;
  return Math.max(0, target - saved);
}
