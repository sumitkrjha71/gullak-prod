// Dynamic motivational copy selector — master prompt §4.3.
// Picks one of 6 contextual i18n keys based on user state.

export type MotivationalKey =
  | 'motivational.new'
  | 'motivational.streak'
  | 'motivational.goal50'
  | 'motivational.nudge'
  | 'motivational.passive'
  | 'motivational.postWithdraw';

export function pickCopyKey(ctx: {
  daysSinceFirstSave: number;
  streak: number;
  primaryGoalProgressPct: number;
  lastWithdrawalAtIso?: string | null;
}): MotivationalKey {
  // Recent withdrawal (within 48h) → celebrate
  if (ctx.lastWithdrawalAtIso) {
    const diffH = (Date.now() - new Date(ctx.lastWithdrawalAtIso).getTime()) / 3600_000;
    if (diffH < 48) return 'motivational.postWithdraw';
  }
  // First week → encourage new user
  if (ctx.daysSinceFirstSave <= 7) return 'motivational.new';
  // Crossed 50% on primary goal
  if (ctx.primaryGoalProgressPct >= 50 && ctx.primaryGoalProgressPct < 75) return 'motivational.goal50';
  // Active streak (3+ days)
  if (ctx.streak >= 3) return 'motivational.streak';
  // Default rotates between nudge / passive every 3 days
  return Math.floor(ctx.daysSinceFirstSave / 3) % 2 === 0 ? 'motivational.nudge' : 'motivational.passive';
}
