// V5 M3 — Tier definitions for the Gullak streak/badge system.
//
// Tier names are CONFIG-SWAPPABLE: edit messages/{locale}.json → tiers.tN.name to swap.
// Default = Option A (heroic/classic). Other options preserved as commented suggestions
// at top of messages/en.json under `_tier_options_for_swap` for easy reference.
//
// Streak math: User.streak.currentDays counts unbroken save days (with weekly freebies).
// Tier is determined purely by currentDays — no separate streak rows needed.

export type Tier = {
  id: 'beginner' | 't1' | 't2' | 't3' | 't4' | 't5';
  /** Minimum streak days to unlock. 0 = beginner (default for everyone before first save) */
  minDays: number;
  /** i18n key for display name */
  nameKey: string;
  /** i18n key for unlock-modal celebration copy */
  celebrateKey: string;
  /** Emoji shown on the tier card */
  emoji: string;
  /** CSS color used for tier card accents (matches palette tokens) */
  color: string;
  /** Background gradient for the card */
  bg: string;
};

export const TIERS: Tier[] = [
  {
    id: 'beginner',
    minDays: 0,
    nameKey: 'tiers.beginner.name',
    celebrateKey: 'tiers.beginner.celebrate',
    emoji: '🌱',
    color: 'var(--muted)',
    bg: 'linear-gradient(145deg, #f5f0ea, #faf6ef)',
  },
  {
    id: 't1',
    minDays: 3,
    nameKey: 'tiers.t1.name',
    celebrateKey: 'tiers.t1.celebrate',
    emoji: '🪙',
    color: '#D4A017',
    bg: 'linear-gradient(145deg, #fff5d6, #fff9e6)',
  },
  {
    id: 't2',
    minDays: 7,
    nameKey: 'tiers.t2.name',
    celebrateKey: 'tiers.t2.celebrate',
    emoji: '⚔️',
    color: '#E8650A',
    bg: 'linear-gradient(145deg, #FFE9D2, #FFF5EC)',
  },
  {
    id: 't3',
    minDays: 30,
    nameKey: 'tiers.t3.name',
    celebrateKey: 'tiers.t3.celebrate',
    emoji: '🛡️',
    color: '#C4602A',
    bg: 'linear-gradient(145deg, #FFD8B8, #FFEAD0)',
  },
  {
    id: 't4',
    minDays: 90,
    nameKey: 'tiers.t4.name',
    celebrateKey: 'tiers.t4.celebrate',
    emoji: '🐅',
    color: '#0E8C7A',
    bg: 'linear-gradient(145deg, #d6f5ee, #e6f7f4)',
  },
  {
    id: 't5',
    minDays: 365,
    nameKey: 'tiers.t5.name',
    celebrateKey: 'tiers.t5.celebrate',
    emoji: '🌟',
    color: '#1A7A4A',
    bg: 'linear-gradient(145deg, #d6f0e0, #ebf5e6)',
  },
];

/** Resolve current tier from streak days. Always returns a non-null Tier. */
export function tierForStreak(currentDays: number): Tier {
  let current = TIERS[0];
  for (const t of TIERS) {
    if (currentDays >= t.minDays) current = t;
  }
  return current;
}

/** Find the next tier (the one user is progressing toward). Null if at top. */
export function nextTier(currentDays: number): Tier | null {
  const cur = tierForStreak(currentDays);
  const idx = TIERS.findIndex((t) => t.id === cur.id);
  return TIERS[idx + 1] ?? null;
}

/** Days remaining to reach next tier. 0 if already at top. */
export function daysToNextTier(currentDays: number): number {
  const next = nextTier(currentDays);
  if (!next) return 0;
  return Math.max(0, next.minDays - currentDays);
}

/** Progress (0-100) within the current tier band toward the next. */
export function tierProgressPct(currentDays: number): number {
  const cur = tierForStreak(currentDays);
  const next = nextTier(currentDays);
  if (!next) return 100;
  const span = next.minDays - cur.minDays;
  if (span <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round(((currentDays - cur.minDays) / span) * 100)));
}
